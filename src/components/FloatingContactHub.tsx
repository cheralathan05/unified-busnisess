import { motion } from "framer-motion";
import { MessageCircle, Mail, Phone, X } from "lucide-react";
import { useState } from "react";

interface FloatingContactHubProps {
  email: string;
  whatsappPhone?: string;
  callPhone?: string;
  businessName?: string;
}

/**
 * Premium Floating Contact Hub
 * Fixed position widget for easy client communication channels
 */
export function FloatingContactHub({
  email,
  whatsappPhone = "+91 00000 00000",
  callPhone = "+91 00000 00000",
  businessName = "our team",
}: FloatingContactHubProps) {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      color: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-400/30",
      textColor: "text-emerald-100",
      href: `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in learning more about the ${businessName} project intake.`)}`,
    },
    {
      icon: Mail,
      label: "Email",
      color: "from-sky-400 to-blue-500",
      bgColor: "bg-sky-500/20",
      borderColor: "border-sky-400/30",
      textColor: "text-sky-100",
      href: `mailto:${email}?subject=Project Intake - ${businessName}`,
    },
    {
      icon: Phone,
      label: "Call",
      color: "from-violet-400 to-purple-500",
      bgColor: "bg-violet-500/20",
      borderColor: "border-violet-400/30",
      textColor: "text-violet-100",
      href: `tel:${callPhone}`,
    },
  ];

  return (
    <>
      {/* Desktop: Fixed Floating Hub */}
      <motion.div className="fixed bottom-4 right-4 hidden md:block">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute bottom-16 right-0 mb-2 rounded-2xl ${isOpen ? "block" : "hidden"} border border-white/15 bg-black/60 backdrop-blur-2xl p-3 space-y-2`}
        >
          {contactOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <motion.a
                key={option.label}
                href={option.href}
                target={option.label === "Call" ? "_self" : "_blank"}
                rel={option.label === "Call" ? "" : "noreferrer"}
                initial={{ opacity: 0, x: 12, scale: 0.9 }}
                animate={
                  isOpen
                    ? { opacity: 1, x: 0, scale: 1 }
                    : { opacity: 0, x: 12, scale: 0.9 }
                }
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition border ${option.bgColor} ${option.borderColor} ${option.textColor} hover:opacity-90`}
              >
                <Icon className="h-4 w-4" /> {option.label}
              </motion.a>
            );
          })}
        </motion.div>

        {/* Main Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transition"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <MessageCircle className="h-6 w-6 text-white" />
            )}
          </motion.div>

          {/* Pulse Animation */}
          {!isOpen && (
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-0 rounded-full bg-cyan-400 -z-10"
            />
          )}
        </motion.button>
      </motion.div>

      {/* Mobile: Inline Contact Options */}
      <div className="md:hidden mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold mb-3">Need Help?</h3>
        <div className="grid grid-cols-3 gap-2">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.a
                key={option.label}
                href={option.href}
                target={option.label === "Call" ? "_self" : "_blank"}
                rel={option.label === "Call" ? "" : "noreferrer"}
                whileHover={{ scale: 1.02 }}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs font-medium border ${option.bgColor} ${option.borderColor} ${option.textColor} text-center`}
              >
                <Icon className="h-5 w-5" />
                <span>{option.label}</span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**
 * Quick Help Tooltip
 * Shows contexual help based on form section
 */
interface QuickHelpTooltipProps {
  title: string;
  tips: string[];
}

export function QuickHelpTooltip({ title, tips }: QuickHelpTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-yellow-300/30 bg-yellow-300/10 p-3"
    >
      <p className="text-xs font-semibold text-yellow-200 mb-2">💡 {title}</p>
      <ul className="space-y-1">
        {tips.map((tip, idx) => (
          <li key={tip} className="text-xs text-yellow-100/80">
            {idx + 1}. {tip}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default {
  FloatingContactHub,
  QuickHelpTooltip,
};
