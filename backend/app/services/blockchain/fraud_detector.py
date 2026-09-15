import networkx as nx
from typing import List
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.mutation_event import MutationEvent
from app.models.fraud_flag import FraudFlag, FlagType, Severity

def build_transfer_graph(transfers: List[MutationEvent]) -> nx.DiGraph:
    G = nx.DiGraph()
    for tx in transfers:
        G.add_edge(
            tx.from_owner, 
            tx.to_owner, 
            price=tx.transfer_price, 
            date=tx.transfer_date,
            id=tx.id
        )
    return G

def detect_circular_resale(G: nx.DiGraph) -> List[dict]:
    cycles = list(nx.simple_cycles(G))
    flags = []
    
    for cycle in cycles:
        if len(cycle) >= 2:
            # Verify timestamps - are they within 2 years?
            # A simplistic check: get edges in cycle
            cycle_edges = []
            for i in range(len(cycle)):
                u = cycle[i]
                v = cycle[(i + 1) % len(cycle)]
                edge_data = G.get_edge_data(u, v)
                cycle_edges.append(edge_data)
                
            dates = [e['date'] for e in cycle_edges if e.get('date')]
            if dates:
                min_date = min(dates)
                max_date = max(dates)
                if (max_date - min_date) <= timedelta(days=730): # 2 years
                    flags.append({
                        "cycle": cycle,
                        "description": f"Circular resale pattern detected within {len(cycle)} nodes over short period."
                    })
    return flags

def detect_price_inflation(G: nx.DiGraph) -> List[dict]:
    flags = []
    for u, v, data in G.edges(data=True):
        out_edges = G.out_edges(v, data=True)
        for _, w, next_data in out_edges:
            price1 = data.get('price')
            price2 = next_data.get('price')
            date1 = data.get('date')
            date2 = next_data.get('date')
            
            if price1 and price2 and date1 and date2:
                if price1 > 0:
                    increase = (price2 - price1) / price1
                    time_diff = (date2 - date1).days
                    if increase > 3.0 and time_diff <= 180: # 300% in 180 days
                        flags.append({
                            "chain": [u, v, w],
                            "description": f"Price inflated by {increase*100:.1f}% within {time_diff} days."
                        })
    return flags

async def run_fraud_analysis(land_record_id: int, db: AsyncSession) -> List[FraudFlag]:
    q = select(MutationEvent).where(MutationEvent.land_record_id == land_record_id)
    res = await db.execute(q)
    transfers = res.scalars().all()
    
    if not transfers:
        return []
        
    G = build_transfer_graph(list(transfers))
    flags = []
    
    # 1. Circular resale
    circular = detect_circular_resale(G)
    for c in circular:
        flags.append(FraudFlag(
            land_record_id=land_record_id,
            flag_type=FlagType.circular_resale,
            severity=Severity.critical,
            description=c["description"],
            evidence_json={"cycle": c["cycle"]}
        ))
        
    # 2. Price inflation
    inflation = detect_price_inflation(G)
    for inf in inflation:
        flags.append(FraudFlag(
            land_record_id=land_record_id,
            flag_type=FlagType.price_inflation,
            severity=Severity.high,
            description=inf["description"],
            evidence_json={"chain": inf["chain"]}
        ))
        
    # Save flags
    for f in flags:
        db.add(f)
    if flags:
        await db.commit()
        
    return flags
