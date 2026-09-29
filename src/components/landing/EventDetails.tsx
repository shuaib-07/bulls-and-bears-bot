"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, DollarSign, Phone, ShieldCheck } from "lucide-react";
import { EVENT_DETAILS } from "@/src/lib/market-data";

export function EventDetails() {
  return (
    <section id="event" className="relative py-24 px-4 md:px-8">
      <div className="section-slab">
        <div className="section-inner max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#FF5F1F] mb-3">
              <span className="w-1.5 h-1.5 bg-[#FF5F1F]"></span>
              CAMPUS SCHEDULE // LIVE LOGISTICS
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
              EVENT SPECIFICATIONS
            </h2>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed">
              Hosted in-person at Ramaiah University of Applied Sciences for BSc Data Science students.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Date & Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 flex items-center justify-center text-[#FF5F1F] mb-4">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717a] mb-1">Date & Time</div>
                <div className="text-lg font-bold text-white mb-1 font-display">{EVENT_DETAILS.date}</div>
                <div className="text-xs text-[#a1a1aa] font-mono">{EVENT_DETAILS.time}</div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#18181b] text-[10px] font-mono text-[#71717a]">
                Duration: 2 Hours (Multi-Round Format)
              </div>
            </motion.div>

            {/* Card 2: Venue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="p-6 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] mb-4">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717a] mb-1">Venue Location</div>
                <div className="text-lg font-bold text-white mb-1 font-display">{EVENT_DETAILS.venue}</div>
                <div className="text-xs text-[#a1a1aa]">{EVENT_DETAILS.institution}</div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#18181b] text-[10px] font-mono text-[#71717a]">
                Accreditation: {EVENT_DETAILS.accreditation}
              </div>
            </motion.div>

            {/* Card 3: Eligibility & Teams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="p-6 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mb-4">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717a] mb-1">Team Formation</div>
                <div className="text-lg font-bold text-white mb-1 font-display">{EVENT_DETAILS.teamSize}</div>
                <div className="text-xs text-[#a1a1aa]">{EVENT_DETAILS.department} students only</div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#18181b] text-[10px] font-mono text-[#10B981]">
                Registration: {EVENT_DETAILS.registrationFee}
              </div>
            </motion.div>

            {/* Card 4: Virtual Capital */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="p-6 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#eab308]/10 border border-[#eab308]/30 flex items-center justify-center text-[#eab308] mb-4">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717a] mb-1">Starting Baseline</div>
                <div className="text-lg font-bold text-white mb-1 font-display">$100,000 Capital</div>
                <div className="text-xs text-[#a1a1aa]">Equal starting portfolio for every team</div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#18181b] text-[10px] font-mono text-[#71717a]">
                100% Virtual • Zero Financial Risk
              </div>
            </motion.div>

            {/* Card 5: Organizers & Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              whileHover={{ y: -4 }}
              className="p-6 bg-[#09090b]/80 border border-[#1e1e1e] rounded-sm flex flex-col justify-between md:col-span-2 lg:col-span-2"
            >
              <div>
                <div className="w-8 h-8 rounded-sm bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7] mb-4">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717a] mb-1">Event Coordinators</div>
                <div className="text-base font-bold text-white mb-4">Questions or Live Inquiries?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {EVENT_DETAILS.contacts.map((c) => (
                    <div key={c.name} className="p-3 bg-[#030303] border border-[#1e1e1e] rounded-sm">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[#FF5F1F] font-semibold mt-1">{c.phone}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#18181b] text-[10px] font-mono text-[#71717a] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                Official Ramaiah University Department of Data Science Event
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
