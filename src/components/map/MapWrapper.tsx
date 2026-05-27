"use client";

import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
      Loading map...
    </div>
  ),
});

export default DeliveryMap;
