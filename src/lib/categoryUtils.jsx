import React from "react";
import {
  Smartphone,
  Laptop,
  Gem,
  Headphones,
  Tag,
  Sparkles,
  Sofa,
  Apple,
  Grid,
  Package
} from "lucide-react";

export const getCategoryIcon = (categoryName, isSelected) => {
  const name = (categoryName || "").toLowerCase();
  
  // Define category matching rules
  const rules = [
    {
      match: (n) => n.includes("هاتف") || n.includes("هواتف") || n.includes("موبايل") || n.includes("phone"),
      Icon: Smartphone,
      color: "text-blue-500"
    },
    {
      match: (n) => n.includes("كمبيوتر") || n.includes("لابتوب") || n.includes("شاشات") || n.includes("شاشة") || n.includes("laptop") || n.includes("computer") || n.includes("إلكترونيات") || n.includes("electronics") || n.includes("أجهزة"),
      Icon: Laptop,
      color: "text-indigo-500"
    },
    {
      match: (n) => n.includes("ساعة") || n.includes("ساعات") || n.includes("watch"),
      Icon: Gem,
      color: "text-amber-500"
    },
    {
      match: (n) => n.includes("صوت") || n.includes("صوتيات") || n.includes("سماعة") || n.includes("سماعات") || n.includes("audio") || n.includes("sound") || n.includes("headphone"),
      Icon: Headphones,
      color: "text-rose-500"
    },
    {
      match: (n) => n.includes("إكسسوار") || n.includes("اكسسوار") || n.includes("accessories") || n.includes("حقائب") || n.includes("شنط") || n.includes("جراب"),
      Icon: Tag,
      color: "text-teal-500"
    },
    {
      match: (n) => n.includes("تجميل") || n.includes("cosmetics") || n.includes("مستحضرات") || n.includes("مكياج"),
      Icon: Sparkles,
      color: "text-emerald-500"
    },
    {
      match: (n) => n.includes("أثاث") || n.includes("furniture") || n.includes("منزل") || n.includes("كرسي") || n.includes("طاولة"),
      Icon: Sofa,
      color: "text-rose-500"
    },
    {
      match: (n) => n.includes("بقالة") || n.includes("grocery") || n.includes("أغذية") || n.includes("طعام") || n.includes("أكل"),
      Icon: Apple,
      color: "text-teal-500"
    },
    {
      match: (n) => n === "الكل" || n === "all",
      Icon: Grid,
      color: "text-slate-400"
    }
  ];

  const matchRule = rules.find((rule) => rule.match(name));
  const IconComponent = matchRule ? matchRule.Icon : Package;
  const defaultColor = matchRule ? matchRule.color : "text-slate-500";

  // Let the icons keep their beautiful original color against the light background when selected
  const finalColor = defaultColor;

  return <IconComponent className={`w-4 h-4 transition-colors ${finalColor}`} id={`category-icon-${name}`} />;
};
