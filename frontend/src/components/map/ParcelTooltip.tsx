import { StatusBadge } from '../ui/StatusBadge';
import { ShieldCheck } from 'lucide-react';

export function ParcelTooltip({ parcel }: { parcel: any }) {
  return (
    <div className="min-w-[200px] p-1">
      <h3 className="font-bold text-sm mb-1">{parcel.ownerName || 'Unknown Owner'}</h3>
      <div className="text-xs text-gray-600 mb-2">
        <p>Survey No: {parcel.surveyNumber}</p>
        <p>Khasra: {parcel.khasraNumber}</p>
        <p>Area: {parcel.area} Hectares</p>
      </div>
      <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t">
        <StatusBadge status={parcel.status || 'pending'} />
        {parcel.blockchainLocked && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
            <ShieldCheck className="w-3 h-3" /> Blockchain Verified
          </span>
        )}
      </div>
    </div>
  );
}
