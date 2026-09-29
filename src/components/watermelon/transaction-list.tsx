'use client';

import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from 'motion/react';
import { useState } from 'react';
import { ArrowRight, X, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import useMeasure from 'react-use-measure';

export interface Transaction {
  id: string;
  icon: React.ReactNode;
  name: string;
  category: string;
  amount: string;
  date: string;
  time: string;
  transactionId: string;
  paymentMethod: string;
  cardNumber: string;
  cardType: string;
}

const springConfig: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.5,
};

const opacityConfig: Transition = {
  duration: 0.3,
  ease: [0.19, 1, 0.22, 1],
};

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const isOpen = open === null;
  const [ref, bounds] = useMeasure();

  const selected = transactions.find((t) => t.id === open) ?? null;

  return (
    <MotionConfig transition={springConfig}>
      <motion.div
        className="flex items-center justify-center overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] shadow-2xl backdrop-blur-xl font-mono select-none"
        animate={{ height: bounds.height > 0 ? bounds.height : 'auto' }}
      >
        <div className="p-4" ref={ref}>
          <AnimatePresence mode="popLayout">
            {isOpen ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={opacityConfig}
                className="flex w-72 sm:w-80 flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1e1e1e]">
                  <span className="font-extrabold text-xs text-[#FF5F1F] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Audit Stream
                  </span>
                  <span className="text-[10px] text-[#71717a]">{transactions.length} entries</span>
                </div>

                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {transactions.map((item) => (
                    <TransactionItem
                      key={item.id}
                      data={item}
                      onClick={() => setOpen(item.id)}
                    />
                  ))}
                </div>

                <div className="pt-2 border-t border-[#1e1e1e] flex items-center justify-between text-[10px] text-[#71717a]">
                  <span>Click entry to inspect receipt</span>
                  <span className="text-[#10B981]">● Live Sync</span>
                </div>
              </motion.div>
            ) : (
              selected && (
                <motion.div exit={{ opacity: 0 }}>
                  <TransactionItemExpanded
                    data={selected}
                    onClose={() => setOpen(null)}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </MotionConfig>
  );
}

function TransactionItem({
  data,
  onClick,
}: {
  data: Transaction;
  onClick: () => void;
}) {
  return (
    <div
      className="flex w-full cursor-pointer items-center gap-3 p-2 rounded-xl border border-transparent hover:border-[#27272a] hover:bg-[#18181b] transition-all"
      onClick={onClick}
    >
      <motion.div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#030303] border border-[#27272a]"
        layoutId={`icon-${data.id}`}
      >
        <div className="flex items-center justify-center">{data.icon}</div>
      </motion.div>

      <div className="flex flex-1 flex-col justify-center text-xs min-w-0">
        <motion.p
          className="font-bold text-white truncate"
          layoutId={`name-${data.id}`}
        >
          {data.name}
        </motion.p>

        <motion.p
          className="text-[10px] text-[#71717a]"
          layoutId={`category-${data.id}`}
        >
          {data.category} • {data.time}
        </motion.p>
      </div>

      <motion.p
        className="flex items-center text-xs font-bold text-[#10B981]"
        layoutId={`amount-${data.id}`}
      >
        {data.amount}
      </motion.p>
    </div>
  );
}

function TransactionItemExpanded({
  data,
  onClose,
}: {
  data: Transaction;
  onClose: () => void;
}) {
  return (
    <div className="flex w-72 sm:w-80 flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e1e1e]">
        <motion.div
          className="flex size-9 items-center justify-center rounded-lg bg-[#030303] border border-[#27272a]"
          layoutId={`icon-${data.id}`}
        >
          {data.icon}
        </motion.div>

        <div
          className="flex cursor-pointer items-center justify-center rounded-full bg-[#18181b] border border-[#27272a] p-1.5 text-[#a1a1aa] hover:text-white transition-colors"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <motion.p
            className="font-bold text-white text-sm"
            layoutId={`name-${data.id}`}
          >
            {data.name}
          </motion.p>

          <motion.p
            className="text-[10px] text-[#FF5F1F] font-semibold"
            layoutId={`category-${data.id}`}
          >
            {data.category}
          </motion.p>
        </div>

        <motion.p
          className="text-base font-extrabold text-[#10B981]"
          layoutId={`amount-${data.id}`}
        >
          {data.amount}
        </motion.p>
      </div>

      <motion.div
        className="flex flex-col gap-2 text-xs pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          ...opacityConfig,
          delay: 0.1,
        }}
      >
        <div className="border-t border-dashed border-[#27272a]" />

        <div className="space-y-1.5 text-[11px] bg-[#030303] p-3 rounded-lg border border-[#1e1e1e]">
          <div className="flex justify-between text-[#71717a]">
            <span>Order ID:</span>
            <span className="font-bold text-white">#{data.transactionId}</span>
          </div>

          <div className="flex justify-between text-[#71717a]">
            <span>Session / Round:</span>
            <span className="text-white">{data.date}</span>
          </div>

          <div className="flex justify-between text-[#71717a]">
            <span>Timestamp:</span>
            <span className="text-white">{data.time}</span>
          </div>

          <div className="flex justify-between text-[#71717a]">
            <span>Payment Account:</span>
            <span className="text-white">{data.paymentMethod}</span>
          </div>

          <div className="flex justify-between text-[#71717a]">
            <span>Execution Volume:</span>
            <span className="font-bold text-[#FF5F1F]">{data.cardNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Execution cryptographic signature verified</span>
        </div>
      </motion.div>
    </div>
  );
}
