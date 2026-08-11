import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShoppingBag,
  X,
  Search,
  Check,
  Lock,
  ChevronDown,
  ChevronLeft,
  Trash2,
  Menu,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ------------------------- local storage shim ---------------------------
   Артефакти Claude мають вбудований window.storage. Поза Claude такого
   API не існує, тож тут ми підміняємо його на звичайний localStorage
   браузера з тим самим інтерфейсом (get/set/delete/list).
   ВАЖЛИВО: localStorage зберігається лише в межах ОДНОГО браузера на
   ОДНОМУ пристрої. Замовлення, оформлені клієнтами на їхніх телефонах/
   комп'ютерах, НЕ будуть видні в адмін-панелі на вашому пристрої, поки
   сайт не отримає справжній сервер і базу даних (це наступний крок
   після домену — див. README.md).
---------------------------------------------------------------------- */
if (typeof window !== "undefined" && !window.storage) {
  const PREFIX = "silktrace:";
  window.storage = {
    async get(key, shared) {
      const raw = window.localStorage.getItem(PREFIX + (shared ? "shared:" : "priv:") + key);
      if (raw === null) throw new Error("Key not found: " + key);
      return { key, value: raw, shared: !!shared };
    },
    async set(key, value, shared) {
      window.localStorage.setItem(PREFIX + (shared ? "shared:" : "priv:") + key, value);
      return { key, value, shared: !!shared };
    },
    async delete(key, shared) {
      window.localStorage.removeItem(PREFIX + (shared ? "shared:" : "priv:") + key);
      return { key, deleted: true, shared: !!shared };
    },
    async list(prefix, shared) {
      const scope = PREFIX + (shared ? "shared:" : "priv:");
      const full = scope + (prefix || "");
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.indexOf(full) === 0) keys.push(k.slice(scope.length));
      }
      return { keys, prefix, shared: !!shared };
    },
  };
}

/* ----------------------------- design tokens ---------------------------- */
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap";

const COLORS = {
  base: "#F4E7EC",
  card: "#FFFBF9",
  ink: "#241419",
  aubergine: "#3B1F2B",
  rose: "#A8637E",
  roseDark: "#8B4C64",
  gold: "#C9A455",
  line: "rgba(59,31,43,0.14)",
};

/* ------------------------------ swatch data ------------------------------ */
const SWATCHES = {
  "Чорний": "#241419", "чорний": "#241419",
  "Бежевий": "#D9BFA5", "beige": "#D9BFA5",
  "Бордовий": "#6B2039", "бордовий": "#6B2039",
  "Пудровий": "#E7B8C4", "powder pink": "#E7B8C4",
  "Смарагдовий": "#2F6B55",
  "Білий": "#F7F1EC", "білий": "#F7F1EC", "whisper white": "#F7F3EE",
  "Сірий": "#9C9088", "сірий": "#9C9088",
  "Синій": "#2C3E63", "синій": "#2C3E63", "blue": "#2C3E63",
  "Лавандовий": "#9C89B8",
  "black": "#241419",
  "milk": "#F3E9DD",
  "red": "#B23A3A",
  "electric fuchsia": "#E0338C",
  "jelly mint": "#B9E4D0",
  "blue aura": "#B9CFE8",
  "brown": "#6B4A34",
  "блакитний": "#8FC1E3", "блакинтний": "#8FC1E3",
  "кремовий": "#F0E4D0",
  "оливковий": "#7A7F4E",
  "фіолетовий": "#6C4E86",
};
const FALLBACK_SWATCH = "#B7ADA6";

function swatchBackground(colorName) {
  if (!colorName) return FALLBACK_SWATCH;
  if (colorName === "різний колір") {
    return "repeating-linear-gradient(45deg, " + COLORS.rose + " 0px, " + COLORS.rose + " 7px, " + COLORS.gold + " 7px, " + COLORS.gold + " 14px, " + COLORS.aubergine + " 14px, " + COLORS.aubergine + " 21px)";
  }
  if (colorName.indexOf("/") !== -1) {
    const parts = colorName.split("/").map((p) => p.trim());
    const c1 = SWATCHES[parts[0]] || FALLBACK_SWATCH;
    const c2 = SWATCHES[parts[1]] || FALLBACK_SWATCH;
    return "linear-gradient(90deg, " + c1 + " 50%, " + c2 + " 50%)";
  }
  return SWATCHES[colorName] || FALLBACK_SWATCH;
}

/* ------------------------------ category art ------------------------------ */
const CategoryArt = ({ category, stroke = "#FFFBF9" }) => {
  const common = { fill: "none", stroke, strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (category) {
    case "bra":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M20 40 C20 30 30 26 38 32 C42 35 46 40 50 46 C54 40 58 35 62 32 C70 26 80 30 80 40 C80 52 66 62 50 66 C34 62 20 52 20 40 Z" {...common} />
          <path d="M38 32 L34 14 M62 32 L66 14" {...common} />
        </svg>
      );
    case "panty":
    case "panty_boy":
    case "panty_girl":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M24 26 H76 C76 26 74 46 66 56 C60 63 54 66 50 74 C46 66 40 63 34 56 C26 46 24 26 24 26 Z" {...common} />
          <path d="M24 26 L14 30 M76 26 L86 30" {...common} />
        </svg>
      );
    case "swim":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M24 22 C24 15 32 12 38 17 C42 19 46 23 50 27 C54 23 58 19 62 17 C68 12 76 15 76 22 C76 31 65 38 50 41 C35 38 24 31 24 22 Z" {...common} />
          <path d="M30 52 H70 C70 52 68 68 61 76 C57 81 53 83 50 89 C47 83 43 81 39 76 C32 68 30 52 30 52 Z" {...common} />
        </svg>
      );
    case "pajama":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M38 18 C38 14 44 12 50 12 C56 12 62 14 62 18 L70 30 L62 26 L66 88 H34 L38 26 L30 30 Z" {...common} />
        </svg>
      );
    case "mens_brief":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect x="22" y="20" width="56" height="14" rx="4" {...common} />
          <path d="M26 34 L26 82 H42 L42 50 L58 50 L58 82 H74 L74 34" {...common} />
        </svg>
      );
    case "socks_women":
    case "socks_men":
    case "socks_kids":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M40 12 H62 V48 C62 56 66 60 74 62 L86 66 C92 68 91 76 84 78 L48 78 C41 78 38 73 38 66 Z" {...common} />
          <path d="M40 22 H62" {...common} strokeWidth="1.4" />
        </svg>
      );
    case "accessory":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M30 14 H70 V34 C70 34 68 44 62 50 L64 88 H54 L50 52 L46 88 H36 L38 50 C32 44 30 34 30 34 Z" {...common} />
          <path d="M30 22 H70" {...common} strokeWidth="1.4" />
        </svg>
      );
    case "tank":
    case "tank_men":
    case "tank_boy":
    case "tank_girl":
    case "kids":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <path d="M32 18 L28 30 L36 26 L36 82 H64 L64 26 L72 30 L68 18 C68 18 60 24 50 24 C40 24 32 18 32 18 Z" {...common} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="28" {...common} />
        </svg>
      );
  }
};

/* ------------------------------ catalog data ------------------------------ */
const CATALOG_RAW = JSON.parse(`[{"article": "1024/37", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер July", "price": 1999, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["70B", "75B", "75C", "75D", "80B", "80C"]}]}, {"article": "1028/35", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Pola", "price": 1749, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C", "75A", "75B", "75C"]}, {"color": "milk", "sizes": ["70B", "70C", "75A", "75B", "75C", "75D", "80A", "80B", "80C"]}, {"color": "electric fuchsia", "sizes": ["70C", "75A", "75B", "75C"]}]}, {"article": "1033/35", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Moly", "price": 1499, "brand": "Jasmine", "colors": [{"color": "powder pink", "sizes": ["70C", "75C", "75D", "80C", "80D"]}]}, {"article": "1124/32", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Ines", "price": 1199, "brand": "Jasmine", "colors": [{"color": "red", "sizes": ["70B", "70C", "75A", "75B", "75C", "75D"]}]}, {"article": "1126/58", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Liza", "price": 1247, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C", "70D", "75A", "75B", "75C", "75D", "80B", "80C", "85B"]}]}, {"article": "1201/14", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Muse", "price": 997, "brand": "Jasmine", "colors": [{"color": "whisper white", "sizes": ["70C", "75B", "75C", "75D", "80A", "80B", "80C"]}, {"color": "beige", "sizes": ["75C", "75D", "80B", "80C"]}]}, {"article": "1301/14", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Macy", "price": 1199, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["80E", "85C", "85D", "85E", "90C", "90D", "90E", "95C"]}]}, {"article": "1401/14", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Luna", "price": 997, "brand": "Jasmine", "colors": [{"color": "whisper white", "sizes": ["80C", "80D", "80E", "80G", "85C", "85D", "85E", "90C", "90D"]}]}, {"article": "1424/37", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Elia", "price": 1849, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["75B", "75C", "80B", "80C"]}]}, {"article": "1438/14", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Niky", "price": 899, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C", "75B", "75C", "80B", "80C", "85B"]}, {"color": "whisper white", "sizes": ["70C", "75B", "75C", "80B", "80C", "85B"]}]}, {"article": "1466/14", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Kler", "price": 1199, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["75C", "75D", "75E", "80C", "80D", "80E", "85C", "85D", "85E"]}]}, {"article": "1480/35", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Izis", "price": 1747, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C", "75A", "75B", "75C"]}]}, {"article": "1497/15", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Leya", "price": 1499, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C", "75A", "75B", "80B"]}]}, {"article": "1622/1", "category": "Бюстгальтери", "categoryKey": "bra", "name": "Бюстгальтер Lili", "price": 699, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XS"]}]}, {"article": "2103/14", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Poetic", "price": 349, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}]}, {"article": "2107/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Meril", "price": 599, "brand": "Jasmine", "colors": [{"color": "jelly mint", "sizes": ["L", "M", "S"]}, {"color": "blue aura", "sizes": ["M", "S"]}, {"color": "milk", "sizes": ["L", "M"]}]}, {"article": "2119/14", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Catrin", "price": 349, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XL"]}, {"color": "whisper white", "sizes": ["L", "M", "S"]}]}, {"article": "2126/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Ilona", "price": 749, "brand": "Jasmine", "colors": [{"color": "jelly mint", "sizes": ["XS"]}]}, {"article": "2135/32", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі S black", "price": 699, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["S"]}]}, {"article": "2136/32", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі S black", "price": 349, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["S"]}]}, {"article": "2151/1", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Molly", "price": 499, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XS"]}]}, {"article": "2156/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Kerry", "price": 749, "brand": "Jasmine", "colors": [{"color": "blue aura", "sizes": ["L", "M", "S", "XL"]}, {"color": "jelly mint", "sizes": ["L", "M", "S", "XL"]}, {"color": "milk", "sizes": ["L", "M", "S", "XL"]}, {"color": "powder pink", "sizes": ["L", "M", "S", "XL"]}, {"color": "electric fuchsia", "sizes": ["S"]}]}, {"article": "2157/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Elina", "price": 599, "brand": "Jasmine", "colors": [{"color": "blue aura", "sizes": ["L", "M", "S", "XL"]}, {"color": "milk", "sizes": ["L", "M", "S", "XL"]}, {"color": "powder pink", "sizes": ["L", "M", "S"]}, {"color": "electric fuchsia", "sizes": ["S"]}]}, {"article": "2161/37", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Janetta", "price": 999, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "2162/37", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Helena", "price": 999, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "2164/15", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Selena", "price": 649, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}]}, {"article": "2201/14", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Divine", "price": 399, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XL"]}, {"color": "whisper white", "sizes": ["14", "L", "M", "S"]}]}, {"article": "2219/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Beata", "price": 599, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["S"]}, {"color": "powder pink", "sizes": ["S"]}]}, {"article": "2220/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Amidy", "price": 699, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}, {"color": "powder pink", "sizes": ["M"]}]}, {"article": "2229/32", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі XL beige", "price": 649, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["M", "S", "XL"]}]}, {"article": "2241/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Lelya", "price": 699, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "2243/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Jenis", "price": 749, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "2253/32", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Eliss", "price": 699, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["M", "S"]}, {"color": "beige", "sizes": ["S"]}]}, {"article": "2263/14 2", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Silvia", "price": 449, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["2XL"]}, {"color": "black", "sizes": ["14"]}, {"color": "whisper white", "sizes": ["2XL"]}]}, {"article": "2263/14", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Silvia", "price": 449, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["L", "M", "S", "XL"]}, {"color": "black", "sizes": ["L", "M", "S", "XL"]}, {"color": "whisper white", "sizes": ["L", "M", "XL"]}]}, {"article": "2273/14", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Deloris", "price": 399, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["2XL", "L", "M", "S", "XL"]}, {"color": "whisper white", "sizes": ["2XL", "L", "M", "S", "XL"]}]}, {"article": "2277/37", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Emidy", "price": 999, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "2278/15", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі S black", "price": 799, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["S"]}]}, {"article": "2279/15", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Besty", "price": 799, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["M", "S"]}]}, {"article": "2324/1", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Bella", "price": 499, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XL", "XS"]}]}, {"article": "2326/35", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Greit", "price": 749, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["2XL", "L", "M", "S", "XL"]}]}, {"article": "2507/32", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі XL beige", "price": 299, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["2XL", "L"]}, {"color": "beige", "sizes": ["L", "M", "XL"]}]}, {"article": "6103", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["XL"]}]}, {"article": "6203", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["L", "XL"]}]}, {"article": "6204", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["L", "S"]}]}, {"article": "6206", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["2XL", "S", "XL"]}]}, {"article": "6207", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["XL"]}]}, {"article": "6208", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["L", "S", "XL"]}, {"color": "black", "sizes": ["L"]}]}, {"article": "6209", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Бежеві", "price": 299, "brand": "Jasmine", "colors": [{"color": "beige", "sizes": ["XL"]}]}, {"article": "6306/38", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1099, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["M", "S"]}]}, {"article": "6308/38", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1749, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["70B", "70C", "75A", "75C", "75D", "80D"]}]}, {"article": "6315/46", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1499, "brand": "Jasmine", "colors": [{"color": "blue", "sizes": ["M", "S"]}]}, {"article": "6345/19", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1499, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70C", "75A", "75C", "80B"]}]}, {"article": "6350/42", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1749, "brand": "Jasmine", "colors": [{"color": "brown", "sizes": ["70D", "75A", "80D", "85C"]}]}, {"article": "6367/68", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 997, "brand": "Jasmine", "colors": [{"color": "beige/black", "sizes": ["L", "M", "S"]}]}, {"article": "6373/68", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1249, "brand": "Jasmine", "colors": [{"color": "beige/black", "sizes": ["L", "M", "S"]}]}, {"article": "6383/19", "category": "Купальники", "categoryKey": "swim", "name": "Бюстгальтер Купальний", "price": 1249, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["70B", "70C"]}]}, {"article": "6402/19", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 799, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["M", "S"]}]}, {"article": "6405/38", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 999, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["S"]}]}, {"article": "6414/38", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 849, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["L", "M", "S"]}]}, {"article": "6418/38", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 1249, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["2XL", "3XL", "XL"]}]}, {"article": "6422/38", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 999, "brand": "Jasmine", "colors": [{"color": "black/white", "sizes": ["L"]}]}, {"article": "6423/19", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 749, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}]}, {"article": "6439/42", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 849, "brand": "Jasmine", "colors": [{"color": "brown", "sizes": ["L", "M", "S"]}]}, {"article": "6458/42", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 999, "brand": "Jasmine", "colors": [{"color": "brown", "sizes": ["XL"]}]}, {"article": "6467/19", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 1149, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["S"]}]}, {"article": "6477/68", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 849, "brand": "Jasmine", "colors": [{"color": "beige/black", "sizes": ["S"]}]}, {"article": "6478/68", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 849, "brand": "Jasmine", "colors": [{"color": "beige/black", "sizes": ["L", "M", "S"]}]}, {"article": "6485/46", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 1249, "brand": "Jasmine", "colors": [{"color": "blue", "sizes": ["L", "M", "S"]}]}, {"article": "6490/19", "category": "Купальники", "categoryKey": "swim", "name": "Плавки Купальні Жіночі", "price": 899, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["M"]}]}, {"article": "6513/42", "category": "Купальники", "categoryKey": "swim", "name": "Купальник Суцільний", "price": 2099, "brand": "Jasmine", "colors": [{"color": "brown", "sizes": ["M", "S"]}]}, {"article": "6526/19", "category": "Купальники", "categoryKey": "swim", "name": "Купальник Суцільний", "price": 1749, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["S"]}]}, {"article": "7208/32", "category": "Аксесуари", "categoryKey": "accessory", "name": "Пояс ДЛЯ Панчіх", "price": 997, "brand": "Jasmine", "colors": [{"color": "milk", "sizes": ["L", "M", "S"]}, {"color": "black", "sizes": ["M", "S"]}]}, {"article": "9101", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Чорні", "price": 239, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}, {"color": "beige", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "9102", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Чорні", "price": 239, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}, {"color": "beige", "sizes": ["S"]}]}, {"article": "9201", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Чорні", "price": 249, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S", "XL"]}, {"color": "beige", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "9204", "category": "Трусики", "categoryKey": "panty", "name": "Труси Жіночі Безшовні Чорні", "price": 249, "brand": "Jasmine", "colors": [{"color": "black", "sizes": ["L", "M", "S"]}, {"color": "beige", "sizes": ["L", "M", "S"]}]}, {"article": "509901 / 5095P", "category": "Трусики для дівчинки", "categoryKey": "panty_girl", "name": "Труси дівчинка", "price": 130, "brand": "Jasmine", "colors": [{"color": "різний колір", "sizes": ["14-15"]}]}, {"article": "4342 / 43113", "category": "Майка для дівчинки", "categoryKey": "tank_girl", "name": "Майка дівчинка", "price": 170, "brand": "Jasmine", "colors": [{"color": "білий", "sizes": ["0-1", "10-11", "8-9"]}]}, {"article": "4342D2 / 434204", "category": "Майка для дівчинки", "categoryKey": "tank_girl", "name": "Майка дівчинка", "price": 170, "brand": "Jasmine", "colors": [{"color": "білий", "sizes": ["2-3", "4-5"]}]}, {"article": "40/15/01", "category": "Майки", "categoryKey": "tank", "name": "Майка жіноча ELLEN", "price": 429, "brand": "Ellen", "colors": [{"color": "білий", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "7742 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 170, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["2-3"]}]}, {"article": "7743 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 250, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["12-13"]}]}, {"article": "7744 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 250, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["14-15"]}]}, {"article": "7745 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 250, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["10-11"]}]}, {"article": "7746 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 250, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["6-7"]}]}, {"article": "7747 / 8742 / 77113", "category": "Майки для хлопчика", "categoryKey": "tank_boy", "name": "Майка хлопчик DONELLA", "price": 250, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["8-9"]}]}, {"article": "400/01/01", "category": "Чоловічі майки", "categoryKey": "tank_men", "name": "Майка чоловіча BRES", "price": 449, "brand": "Bres", "colors": [{"color": "білий", "sizes": ["2XL", "3XL", "L", "M", "S", "XL"]}]}, {"article": "1268127", "category": "Піжами", "categoryKey": "pajama", "name": "Піжама жіноча ELLEN", "price": 2299, "brand": "Ellen", "colors": [{"color": "фіолетовий", "sizes": ["L", "M", "S"]}]}, {"article": "902302", "category": "Піжами", "categoryKey": "pajama", "name": "Піжама жіноча ELLEN", "price": 999, "brand": "Ellen", "colors": [{"color": "кремовий", "sizes": ["L", "M", "S"]}]}, {"article": "391573", "category": "Піжами", "categoryKey": "pajama", "name": "Піжама жіноча ELLEN", "price": 1449, "brand": "Ellen", "colors": [{"color": "білий", "sizes": ["M"]}]}, {"article": "4388/00/01", "category": "Піжами", "categoryKey": "pajama", "name": "Піжама жіноча ELLEN", "price": 1949, "brand": "Ellen", "colors": [{"color": "чорний", "sizes": ["M"]}]}, {"article": "112/63/01", "category": "Піжами", "categoryKey": "pajama", "name": "Сорочка нічна жіноча ELLEN", "price": 929, "brand": "Ellen", "colors": [{"color": "бордовий", "sizes": ["S"]}]}, {"article": "118/07/09", "category": "Піжами", "categoryKey": "pajama", "name": "Сорочка нічна жіноча ELLEN ДЛЯ Годуючих Груддю", "price": 1369, "brand": "Ellen", "colors": [{"color": "блакинтний", "sizes": ["L", "M", "XL"]}]}, {"article": "5971", "category": "Дитяче", "categoryKey": "kids", "name": "Топ дівчинка DONELLA", "price": 200, "brand": "Donella", "colors": [{"color": "білий", "sizes": ["12-13", "14-15"]}]}, {"article": "597143S / 597143Q", "category": "Дитяче", "categoryKey": "kids", "name": "Топ дівчинка DONELLA", "price": 200, "brand": "Donella", "colors": [{"color": "чорний", "sizes": ["14-15", "16-17"]}]}, {"article": "700/15/01", "category": "Піжами", "categoryKey": "pajama", "name": "Топ жіночий ELLEN", "price": 399, "brand": "Ellen", "colors": [{"color": "білий", "sizes": ["L", "M", "S", "XS"]}]}, {"article": "700/15/02", "category": "Піжами", "categoryKey": "pajama", "name": "Топ жіночий ELLEN", "price": 399, "brand": "Ellen", "colors": [{"color": "чорний", "sizes": ["L", "M", "S", "XS"]}]}, {"article": "4171PD1 / 4171WD7", "category": "Трусики для дівчинки", "categoryKey": "panty_girl", "name": "Труси дівчинка DONELLA", "price": 130, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["10-11"]}]}, {"article": "418126", "category": "Трусики для дівчинки", "categoryKey": "panty_girl", "name": "Труси дівчинка DONELLA", "price": 130, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["2-3", "4-5"]}]}, {"article": "4181B49", "category": "Трусики для дівчинки", "categoryKey": "panty_girl", "name": "Труси дівчинка DONELLA", "price": 130, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["4-5"]}]}, {"article": "5171PD12", "category": "Трусики для дівчинки", "categoryKey": "panty_girl", "name": "Труси дівчинка DONELLA", "price": 150, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["16-17"]}]}, {"article": "7511Y3", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 150, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["4-5"]}]}, {"article": "751470", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 150, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["6-7"]}]}, {"article": "7571PB1", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 150, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["4-5"]}]}, {"article": "7571PD2", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 150, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["4-5"]}]}, {"article": "7581B10", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 200, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["8-9"]}]}, {"article": "7581B8 p.6-11", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик DONELLA", "price": 200, "brand": "Donella", "colors": [{"color": "різний колір", "sizes": ["10-11"]}]}, {"article": "201/10/02", "category": "Піжами", "categoryKey": "pajama", "name": "Халат жіночий ELLEN", "price": 1389, "brand": "Ellen", "colors": [{"color": "блакитний", "sizes": ["L", "M", "XL"]}]}, {"article": "76/00/01", "category": "Піжами", "categoryKey": "pajama", "name": "Шорти жіночі Basic ELLEN", "price": 489, "brand": "Ellen", "colors": [{"color": "білий", "sizes": ["L", "M", "S"]}]}, {"article": "76/00/02", "category": "Піжами", "categoryKey": "pajama", "name": "Шорти жіночі Basic ELLEN", "price": 489, "brand": "Ellen", "colors": [{"color": "білий", "sizes": ["S", "XL"]}]}, {"article": "304/03/128", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "білий", "sizes": ["L", "M", "XL"]}]}, {"article": "304/03/130", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "оливковий", "sizes": ["2XL", "L", "M", "S", "XL"]}]}, {"article": "304/03/176", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "сірий", "sizes": ["2XL", "3XL", "4XL", "L", "M", "XL"]}]}, {"article": "304/03/40", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "чорний", "sizes": ["2XL", "3XL", "L", "S", "XL"]}]}, {"article": "306/00/01", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "синій", "sizes": ["2XL", "3XL", "L", "M", "S", "XL"]}]}, {"article": "306/00/02", "category": "Чоловічі труси", "categoryKey": "mens_brief", "name": "Шорти чоловічі BRES", "price": 449, "brand": "Bres", "colors": [{"color": "чорний", "sizes": ["L", "M", "S", "XL"]}]}, {"article": "7612Y10", "category": "Трусики для хлопчика", "categoryKey": "panty_boy", "name": "Труси хлопчик", "price": 110, "brand": "Jasmine", "colors": [{"color": "різний колір", "sizes": ["10-11"]}]}, {"article": "90403", "category": "Трусики", "categoryKey": "panty", "name": "Жіночі трусики Finella Wnsn", "price": 150, "brand": "Jasmine", "colors": [{"color": "різний колір", "sizes": ["S/M, L/XL"]}]}, {"article": "80136", "category": "Трусики", "categoryKey": "panty", "name": "Жіночі трусики Finella Wtsc", "price": 150, "brand": "Jasmine", "colors": [{"color": "різний колір", "sizes": ["S/M, L/XL"]}]}, {"article": "6019", "category": "Аксесуари", "categoryKey": "accessory", "name": "Жіночі капронові колготи зі швом", "price": 400, "brand": "Jasmine", "colors": [{"color": "чорний", "sizes": ["ONE SIZE"]}]}, {"article": "6018", "category": "Аксесуари", "categoryKey": "accessory", "name": "Жіночі капронові колготки з вирізом", "price": 350, "brand": "Jasmine", "colors": [{"color": "чорний", "sizes": ["ONE SIZE"]}]}, {"article": "6830", "category": "Аксесуари", "categoryKey": "accessory", "name": "Жіночі панчохи з мереживною резинкою 40 DEN", "price": 300, "brand": "Jasmine", "colors": [{"color": "чорний", "sizes": ["ONE SIZE"]}]}, {"article": "6005", "category": "Аксесуари", "categoryKey": "accessory", "name": "Жіночі колготки в сіточку", "price": 350, "brand": "Jasmine", "colors": [{"color": "білий", "sizes": ["ONE SIZE"]}]}, {"article": "6004", "category": "Аксесуари", "categoryKey": "accessory", "name": "Колготи Rose", "price": 350, "brand": "Jasmine", "colors": [{"color": "чорний", "sizes": ["ONE SIZE"]}]}, {"article": "382", "category": "Аксесуари", "categoryKey": "accessory", "name": "Панчохи з підв'язками Aura Via 20 DEN", "price": 400, "brand": "Jasmine", "colors": [{"color": "чорний", "sizes": ["36-41"]}]}, {"article": "В19-166", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі стильні сліди", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5552-3", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі білі сліди", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY711-3", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки з сірою стопою", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "CY525-1", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Білі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5567", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки в полоску", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5577", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5571", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5579", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі стильні шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5557-3", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки з леопардовим принтом", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5559-5", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY5557-2", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки з леопардовими смужками", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "Y220-7", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Бамбукові жіночі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "LB1655", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки з принтами", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "Y140-5", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки в пастельному кольорі", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "5800-1", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Білі спортивні шкарпетки, висока посадка", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "2392", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Стильні жіночі шкарпетки р", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "666", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Спортивні жіночі шкарпетки BY", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "Y230", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Літні бамбукові шкарпетки, низька посадка", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BY879", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки середньої подаки з сердечками", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "BX690-1", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки, білі, класичні, низька посадка", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "Y220", "category": "Жіночі шкарпетки", "categoryKey": "socks_women", "name": "Жіночі шкарпетки, преміум якості, бамбукові, р", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["36-41"]}]}, {"article": "AY206-1", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки з сірою стопою", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["41-47"]}]}, {"article": "А9125", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки", "price": 70, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["43-46"]}]}, {"article": "А9319", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки в сітку", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["40-47"]}]}, {"article": "AY264-1", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі сліди в сітку", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["41-47"]}]}, {"article": "AJ:818", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Шовкові чоловічі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["42-48"]}]}, {"article": "AY243", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["40-45"]}]}, {"article": "AY-359", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["42-48"]}]}, {"article": "AY293", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки з бавовни", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["40-45"]}]}, {"article": "CY4014", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Спортивні шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["35-40"]}]}, {"article": "AY244", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Шкарпетки чоловічі з широкою резинкою", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["41-47"]}]}, {"article": "AY135-1", "category": "Чоловічі шкарпетки", "categoryKey": "socks_men", "name": "Чоловічі шкарпетки в базових кольорах", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["41-47"]}]}, {"article": "С3841-3", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі білі шкарпетки в сітку", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["3-4", "5-6"]}]}, {"article": "C3841-3", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі білі шкарпетки в сітку", "price": 80, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["1-2"]}]}, {"article": "D2005-3", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі шкарпетки в сітку", "price": 70, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["3-5", "5-7", "7-9"]}]}, {"article": "CY531", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Підліткові шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["32-37"]}]}, {"article": "CY401-7", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі шкарпетки в сітку", "price": 70, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["3-5"]}]}, {"article": "CY516", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі шкарпетки в базових кольорах", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["10-12", "4-6", "7-9"]}]}, {"article": "CY-508", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі шкарпетки", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["5-8", "9-12"]}]}, {"article": "D315-2", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі шкарпетки, бавовна", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["23-26", "27-30", "31-34"]}]}, {"article": "CY4013", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі стильні шкарпетки в смужку", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["2-4", "9-12"]}]}, {"article": "СY4013", "category": "Дитячі шкарпетки", "categoryKey": "socks_kids", "name": "Дитячі стильні шкарпетки в смужку", "price": 75, "brand": "Корона", "colors": [{"color": "різний колір", "sizes": ["5-8"]}]}]`);

const CATEGORY_ORDER = [
  "Бюстгальтери", "Трусики", "Купальники", "Чоловічі труси", "Піжами",
  "Жіночі шкарпетки", "Дитячі шкарпетки", "Чоловічі шкарпетки", "Аксесуари",
  "Трусики для хлопчика", "Трусики для дівчинки", "Майки для хлопчика",
  "Чоловічі майки", "Майка для дівчинки", "Майки", "Дитяче",
];

const CATALOG = CATALOG_RAW.map((p) => ({ ...p, categoryLabel: p.category }));
const BRANDS = ["Jasmine", "Ellen", "Bres", "Donella", "Корона"];

/* -------------------------------- helpers -------------------------------- */
const money = (v) => v.toLocaleString("uk-UA") + " \u20b4";
const genId = () => Date.now() + "-" + Math.random().toString(36).slice(2, 8);

/* --------------------------------- styles -------------------------------- */
const GlobalStyle = () => (
  <style>{`
    @import url('${FONT_LINK}');
    .lg-root { font-family: 'Jost', sans-serif; background: ${COLORS.base}; color: ${COLORS.ink}; min-height: 100%; }
    .lg-display { font-family: 'Cormorant Garamond', serif; }
    .lg-eyebrow { letter-spacing: 0.16em; text-transform: uppercase; font-size: 0.68rem; font-weight: 500; color: ${COLORS.roseDark}; }
    .lg-btn { font-family: 'Jost', sans-serif; letter-spacing: 0.04em; transition: all .18s ease; }
    .lg-btn-primary { background: ${COLORS.aubergine}; color: ${COLORS.base}; }
    .lg-btn-primary:hover { background: ${COLORS.roseDark}; }
    .lg-btn-outline { border: 1px solid ${COLORS.aubergine}; color: ${COLORS.aubergine}; }
    .lg-btn-outline:hover { background: ${COLORS.aubergine}; color: ${COLORS.base}; }
    .lg-card { background: ${COLORS.card}; border: 1px solid ${COLORS.line}; }
    .lg-card:hover .lg-card-art { transform: scale(1.04); }
    .lg-card-art { transition: transform .35s ease; }
    .lg-scallop { display: block; width: 100%; height: 22px; }
    .lg-chip { border: 1px solid ${COLORS.line}; transition: all .15s ease; white-space: nowrap; }
    .lg-chip.active { background: ${COLORS.aubergine}; color: ${COLORS.base}; border-color: ${COLORS.aubergine}; }
    .lg-chip:not(.active):hover { border-color: ${COLORS.aubergine}; }
    .lg-input { border: 1px solid ${COLORS.line}; background: #fff; }
    .lg-input:focus { outline: 2px solid ${COLORS.rose}; outline-offset: 1px; }
    .lg-drawer { box-shadow: -12px 0 40px rgba(59,31,43,0.18); }
    .lg-swatch { width: 16px; height: 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); display: inline-block; cursor: pointer; }
    .lg-swatch.active { outline: 2px solid ${COLORS.aubergine}; outline-offset: 2px; }
    .lg-cat-scroll { overflow-x: auto; scrollbar-width: none; }
    .lg-cat-scroll::-webkit-scrollbar { display: none; }
    ::selection { background: ${COLORS.rose}; color: white; }
    .lg-focus:focus-visible { outline: 2px solid ${COLORS.rose}; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `}</style>
);

const Scallop = ({ flip }) => (
  <svg className="lg-scallop" viewBox="0 0 400 22" preserveAspectRatio="none" style={{ transform: flip ? "scaleY(-1)" : "none" }}>
    <path
      d="M0,0 C 16.6,22 33.3,22 50,0 C 66.6,22 83.3,22 100,0 C116.6,22 133.3,22 150,0 C166.6,22 183.3,22 200,0 C216.6,22 233.3,22 250,0 C266.6,22 283.3,22 300,0 C316.6,22 333.3,22 350,0 C366.6,22 383.3,22 400,0 L400,0 L0,0 Z"
      fill={COLORS.aubergine}
    />
  </svg>
);

/* ---------------------------------- App ---------------------------------- */
export default function App() {
  const [view, setView] = useState("shop");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("cart", false);
        if (res && res.value) setCart(JSON.parse(res.value));
      } catch (e) {
        // no cart saved yet
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        await window.storage.set("cart", JSON.stringify(cart), false);
      } catch (e) {
        console.error("\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043a\u043e\u0448\u0438\u043a", e);
      }
    })();
  }, [cart, ready]);

  const addToCart = useCallback((product, color, size) => {
    setCart((prev) => {
      const key = product.article + "__" + color + "__" + size;
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c));
      }
      return [
        ...prev,
        {
          key,
          article: product.article,
          name: product.name,
          brand: product.brand,
          category: product.categoryKey,
          color,
          price: product.price,
          size,
          qty: 1,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const updateQty = (key, delta) => {
    setCart((prev) =>
      prev.map((c) => (c.key === key ? { ...c, qty: Math.max(0, c.qty + delta) } : c)).filter((c) => c.qty > 0)
    );
  };

  const removeItem = (key) => setCart((prev) => prev.filter((c) => c.key !== key));

  const total = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  const filtered = useMemo(() => {
    return CATALOG.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchBrand = brand === "all" || p.brand === brand;
      const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.article.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchBrand && matchQuery;
    });
  }, [category, brand, query]);

  useEffect(() => { setVisibleCount(24); }, [category, brand, query]);

  const placeOrder = async (form) => {
    const order = {
      id: genId(),
      createdAt: new Date().toISOString(),
      status: "\u041d\u043e\u0432\u0435",
      customer: form,
      items: cart,
      total,
    };
    try {
      await window.storage.set("order:" + order.id, JSON.stringify(order), true);
      setCart([]);
      setConfirmedOrder(order);
      setCheckoutOpen(false);
    } catch (e) {
      console.error("\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f", e);
      alert("\u0421\u0442\u0430\u043b\u0430\u0441\u044f \u043f\u043e\u043c\u0438\u043b\u043a\u0430 \u043f\u0456\u0434 \u0447\u0430\u0441 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u043d\u044f \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437.");
    }
  };

  return (
    <div className="lg-root">
      <GlobalStyle />
      {view === "shop" ? (
        <Shop
          cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen}
          category={category} setCategory={setCategory}
          brand={brand} setBrand={setBrand}
          query={query} setQuery={setQuery}
          filtered={filtered} visibleCount={visibleCount} setVisibleCount={setVisibleCount}
          addToCart={addToCart} updateQty={updateQty} removeItem={removeItem}
          total={total} itemCount={itemCount}
          checkoutOpen={checkoutOpen} setCheckoutOpen={setCheckoutOpen}
          placeOrder={placeOrder} confirmedOrder={confirmedOrder} setConfirmedOrder={setConfirmedOrder}
          mobileNav={mobileNav} setMobileNav={setMobileNav}
          goAdmin={() => setView("admin")}
        />
      ) : (
        <Admin goShop={() => setView("shop")} />
      )}
    </div>
  );
}

/* --------------------------------- Shop UI -------------------------------- */
function Shop(props) {
  const {
    cart, cartOpen, setCartOpen, category, setCategory, brand, setBrand, query, setQuery,
    filtered, visibleCount, setVisibleCount, addToCart, updateQty, removeItem, total, itemCount,
    checkoutOpen, setCheckoutOpen, placeOrder, confirmedOrder, setConfirmedOrder,
    mobileNav, setMobileNav, goAdmin,
  } = props;

  const shown = filtered.slice(0, visibleCount);

  return (
    <div>
      <header className="sticky top-0 z-30" style={{ background: COLORS.base, borderBottom: "1px solid " + COLORS.line }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4 gap-3">
          <button className="md:hidden lg-focus" onClick={() => setMobileNav((v) => !v)} aria-label="\u041c\u0435\u043d\u044e">
            <Menu size={22} color={COLORS.aubergine} />
          </button>
          <div className="lg-display text-2xl md:text-3xl tracking-wide" style={{ color: COLORS.aubergine }}>
            Silk Trace<span style={{ color: COLORS.rose }}>.</span>
          </div>
          <div className="relative flex-1 max-w-xs hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={COLORS.roseDark} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="\u041f\u043e\u0448\u0443\u043a \u0437\u0430 \u043d\u0430\u0437\u0432\u043e\u044e \u0430\u0431\u043e \u0430\u0440\u0442\u0438\u043a\u0443\u043b\u043e\u043c\u2026"
              className="lg-input lg-focus rounded-full pl-9 pr-4 py-2 text-sm w-full"
            />
          </div>
          <button className="relative lg-focus" onClick={() => setCartOpen(true)} aria-label="\u041a\u043e\u0448\u0438\u043a">
            <ShoppingBag size={22} color={COLORS.aubergine} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ background: COLORS.rose, color: "#fff" }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>
        <div className="md:hidden px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={COLORS.roseDark} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="\u041f\u043e\u0448\u0443\u043a\u2026"
              className="lg-input lg-focus rounded-full pl-9 pr-4 py-2 text-sm w-full"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="lg-eyebrow mb-3">\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u043d\u0430 {CATALOG.length} \u043c\u043e\u0434\u0435\u043b\u0435\u0439</p>
          <h1 className="lg-display text-5xl md:text-6xl leading-[1.05]" style={{ color: COLORS.aubergine }}>
            \u0411\u0456\u043b\u0438\u0437\u043d\u0430, \u044f\u043a\u0430<br />\u0437\u0432\u0443\u0447\u0438\u0442\u044c \u0442\u0438\u0445\u043e,<br />\u0430\u043b\u0435 \u0432\u043f\u0435\u0432\u043d\u0435\u043d\u043e
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(36,20,25,0.75)" }}>
            \u0411\u044e\u0441\u0442\u0433\u0430\u043b\u044c\u0442\u0435\u0440\u0438, \u0442\u0440\u0443\u0441\u0438\u043a\u0438, \u043a\u0443\u043f\u0430\u043b\u044c\u043d\u0438\u043a\u0438, \u043f\u0456\u0436\u0430\u043c\u0438 \u0442\u0430 \u0448\u043a\u0430\u0440\u043f\u0435\u0442\u043a\u0438 \u0432\u0456\u0434 Ellen, Bres, Donella \u0442\u0430 \u0432\u043b\u0430\u0441\u043d\u043e\u0457 \u043a\u043e\u043b\u0435\u043a\u0446\u0456\u0457 Jasmine. \u041e\u043f\u043b\u0430\u0442\u0430 \u043a\u0430\u0440\u0442\u043a\u043e\u044e \u0430\u0431\u043e \u043f\u0440\u0438 \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u043d\u0456.
          </p>
          <button
            className="lg-btn lg-btn-primary lg-focus mt-7 px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm"
            onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
          >
            \u0414\u0438\u0432\u0438\u0442\u0438\u0441\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433 <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["swim", "bra", "pajama", "socks_women", "accessory", "panty"].map((k, i) => {
            const p = CATALOG.find((c) => c.categoryKey === k) || CATALOG[0];
            const col = p.colors[0].color;
            return (
              <div key={k + i} className="rounded-2xl aspect-square flex items-center justify-center p-5" style={{ background: swatchBackground(col), opacity: 0.92, marginTop: i % 2 ? 18 : 0 }}>
                <div style={{ width: "55%", height: "55%" }}>
                  <CategoryArt category={k} stroke="#FFFBF9" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section className="max-w-3xl mx-auto px-5 pb-16 text-center">
        <p className="lg-eyebrow mb-3">\u041f\u0440\u043e \u043d\u0430\u0441</p>
        <p className="lg-display text-2xl md:text-[26px] leading-relaxed" style={{ color: COLORS.aubergine }}>
          Silk Trace \u2014 \u0446\u0435 \u043f\u0440\u043e\u0441\u0442\u0456\u0440, \u0434\u0435 \u0431\u0456\u043b\u0438\u0437\u043d\u0443 \u043e\u0431\u0438\u0440\u0430\u044e\u0442\u044c \u043d\u0435 \u043f\u043e\u0441\u043f\u0456\u0448\u043e\u043c, \u0430 \u0437 \u0443\u0432\u0430\u0433\u043e\u044e \u0434\u043e \u0434\u0435\u0442\u0430\u043b\u0435\u0439: \u043a\u0440\u043e\u044e, \u0442\u043a\u0430\u043d\u0438\u043d\u0438, \u0432\u0456\u0434\u0447\u0443\u0442\u0442\u044f \u043d\u0430 \u0448\u043a\u0456\u0440\u0456.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "rgba(36,20,25,0.7)" }}>
          \u0423 \u043a\u0430\u0442\u0430\u043b\u043e\u0437\u0456 \u2014 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0435\u043d\u0456 \u0456\u043c\u0435\u043d\u0430: \u0432\u043b\u0430\u0441\u043d\u0430 \u043a\u043e\u043b\u0435\u043a\u0446\u0456\u044f Jasmine, \u0434\u043e\u043c\u0430\u0448\u043d\u0456\u0439 \u043e\u0434\u044f\u0433 Ellen, \u0447\u043e\u043b\u043e\u0432\u0456\u0447\u0430 \u043b\u0456\u043d\u0456\u044f Bres, \u0434\u0438\u0442\u044f\u0447\u0430 \u0431\u0456\u043b\u0438\u0437\u043d\u0430 Donella \u0442\u0430 \u0448\u043a\u0430\u0440\u043f\u0435\u0442\u043a\u0438 \u041a\u043e\u0440\u043e\u043d\u0430. {CATALOG.length}+ \u043c\u043e\u0434\u0435\u043b\u0435\u0439, \u0440\u0435\u0430\u043b\u044c\u043d\u0456 \u0430\u0440\u0442\u0438\u043a\u0443\u043b\u0438, \u0440\u043e\u0437\u043c\u0456\u0440\u0438 \u043f\u0456\u0434 \u043a\u043e\u0436\u0435\u043d \u043a\u043e\u043b\u0456\u0440.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "rgba(36,20,25,0.7)" }}>
          \u041c\u0438 \u043d\u0435 \u0436\u0435\u043d\u0435\u043c\u043e\u0441\u044c \u0437\u0430 \u0442\u0440\u0435\u043d\u0434\u0430\u043c\u0438 \u0437\u0430\u0440\u0430\u0434\u0438 \u0442\u0440\u0435\u043d\u0434\u0456\u0432 \u2014 \u043e\u0431\u0438\u0440\u0430\u0454\u043c\u043e \u0442\u0435, \u0449\u043e \u0432\u0438\u0442\u0440\u0438\u043c\u0443\u0454 \u043d\u043e\u0441\u0456\u043d\u043d\u044f \u0434\u0435\u043d\u044c \u0443 \u0434\u0435\u043d\u044c \u0456 \u0437\u0430\u043b\u0438\u0448\u0430\u0454\u0442\u044c\u0441\u044f \u0441\u043e\u0431\u043e\u044e \u043f\u0456\u0441\u043b\u044f \u0441\u043e\u0442\u043e\u0433\u043e \u043f\u0440\u0430\u043d\u043d\u044f. \u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u2014 \u043f\u0440\u044f\u043c\u043e \u043d\u0430 \u0441\u0430\u0439\u0442\u0456, \u043e\u043f\u043b\u0430\u0442\u0430 \u2014 \u043a\u0430\u0440\u0442\u043a\u043e\u044e \u0430\u0431\u043e \u043f\u0440\u0438 \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u043d\u0456, \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u2014 \u041d\u043e\u0432\u043e\u044e \u043f\u043e\u0448\u0442\u043e\u044e \u043f\u043e \u0432\u0441\u0456\u0439 \u0423\u043a\u0440\u0430\u0457\u043d\u0456.
        </p>
      </section>

      <Scallop />

      {/* Catalog */}
      <section id="catalog" style={{ background: COLORS.aubergine }} className="pt-10 pb-4">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h2 className="lg-display text-2xl" style={{ color: COLORS.base }}>
              \u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u00b7 {filtered.length} \u043c\u043e\u0434\u0435\u043b\u0435\u0439
            </h2>
            <div className="flex gap-2 items-center">
              <span className="lg-eyebrow" style={{ color: COLORS.gold }}>\u0411\u0440\u0435\u043d\u0434:</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className="lg-input lg-focus text-xs rounded-full px-3 py-1.5">
                <option value="all">\u0423\u0441\u0456</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="lg-cat-scroll flex gap-2 pb-4">
            <button onClick={() => setCategory("all")} className={"lg-chip lg-focus px-3 py-1.5 rounded-full text-xs flex-shrink-0" + (category === "all" ? " active" : "")}>\u0412\u0441\u0435</button>
            {CATEGORY_ORDER.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={"lg-chip lg-focus px-3 py-1.5 rounded-full text-xs flex-shrink-0" + (category === cat ? " active" : "")}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: COLORS.aubergine }} className="pb-16">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {shown.map((p) => (
            <ProductCard key={p.article} product={p} onAdd={addToCart} />
          ))}
          {filtered.length === 0 && (
            <p style={{ color: COLORS.base }} className="col-span-full text-center py-16 opacity-70">
              \u041d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0456\u043d\u0448\u0438\u0439 \u0437\u0430\u043f\u0438\u0442.
            </p>
          )}
        </div>
        {visibleCount < filtered.length && (
          <div className="text-center mt-8">
            <button onClick={() => setVisibleCount((v) => v + 24)} className="lg-btn lg-focus px-6 py-2.5 rounded-full text-sm" style={{ border: "1px solid " + COLORS.base, color: COLORS.base }}>
              \u041f\u043e\u043a\u0430\u0437\u0430\u0442\u0438 \u0449\u0435 ({filtered.length - visibleCount})
            </button>
          </div>
        )}
      </section>

      <Scallop flip />

      <footer className="max-w-6xl mx-auto px-5 py-10 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs opacity-60">\u00a9 {new Date().getFullYear()} Silk Trace</p>
        <button onClick={goAdmin} className="lg-focus text-xs underline flex items-center gap-1" style={{ color: COLORS.roseDark }}>
          <Lock size={12} /> \u041f\u0430\u043d\u0435\u043b\u044c \u0430\u0434\u043c\u0456\u043d\u0456\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430
        </button>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCartOpen(false)} />
          <div className="lg-drawer relative w-full max-w-md h-full flex flex-col" style={{ background: COLORS.card }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid " + COLORS.line }}>
              <h3 className="lg-display text-2xl" style={{ color: COLORS.aubergine }}>\u041a\u043e\u0448\u0438\u043a</h3>
              <button onClick={() => setCartOpen(false)} className="lg-focus" aria-label="\u0417\u0430\u043a\u0440\u0438\u0442\u0438"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <p className="text-sm opacity-60 mt-10 text-center">\u041a\u043e\u0448\u0438\u043a \u043f\u043e\u043a\u0438 \u043f\u043e\u0440\u043e\u0436\u043d\u0456\u0439.</p>
              ) : (
                cart.map((c) => (
                  <div key={c.key} className="flex gap-3 py-4" style={{ borderBottom: "1px solid " + COLORS.line }}>
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center p-3" style={{ background: swatchBackground(c.color) }}>
                      <CategoryArt category={c.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{c.brand} \u00b7 {c.color} \u00b7 {c.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(c.key, -1)} className="lg-focus w-6 h-6 rounded-full border text-sm" style={{ borderColor: COLORS.line }}>\u2212</button>
                          <span className="text-sm w-4 text-center">{c.qty}</span>
                          <button onClick={() => updateQty(c.key, 1)} className="lg-focus w-6 h-6 rounded-full border text-sm" style={{ borderColor: COLORS.line }}>+</button>
                        </div>
                        <span className="text-sm font-medium">{money(c.price * c.qty)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(c.key)} className="lg-focus self-start opacity-50 hover:opacity-100">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-6 py-5" style={{ borderTop: "1px solid " + COLORS.line }}>
                <div className="flex justify-between text-sm mb-4">
                  <span className="opacity-70">\u0420\u0430\u0437\u043e\u043c</span>
                  <span className="lg-display text-xl" style={{ color: COLORS.aubergine }}>{money(total)}</span>
                </div>
                <button className="lg-btn lg-btn-primary lg-focus w-full py-3 rounded-full text-sm" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                  \u041e\u0444\u043e\u0440\u043c\u0438\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && <CheckoutModal total={total} onClose={() => setCheckoutOpen(false)} onSubmit={placeOrder} />}
      {confirmedOrder && <ConfirmationModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [colorIdx, setColorIdx] = useState(0);
  const colorObj = product.colors[colorIdx];
  const [size, setSize] = useState(colorObj.sizes[Math.floor(colorObj.sizes.length / 2)]);

  useEffect(() => {
    const sizes = product.colors[colorIdx].sizes;
    setSize(sizes[Math.floor(sizes.length / 2)]);
  }, [colorIdx, product]);

  return (
    <div className="lg-card rounded-2xl overflow-hidden flex flex-col">
      <div className="aspect-square flex items-center justify-center p-8 lg-card-art relative" style={{ background: swatchBackground(colorObj.color) }}>
        <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.85)", color: COLORS.aubergine }}>{product.brand}</span>
        <div style={{ width: "58%", height: "58%" }}>
          <CategoryArt category={product.categoryKey} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="lg-eyebrow" style={{ color: COLORS.roseDark, fontSize: "0.6rem" }}>{product.categoryLabel} \u00b7 {product.article}</p>
        <h3 className="text-[13.5px] leading-snug mt-1 mb-2 flex-1" style={{ color: COLORS.ink }}>{product.name}</h3>

        {product.colors.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {product.colors.map((c, i) => (
              <span
                key={c.color + i}
                onClick={() => setColorIdx(i)}
                className={"lg-swatch" + (i === colorIdx ? " active" : "")}
                style={{ background: swatchBackground(c.color) }}
                title={c.color}
              />
            ))}
          </div>
        )}
        {product.colors.length === 1 && (
          <p className="text-[11px] opacity-60 mb-2">{colorObj.color}</p>
        )}

        <select value={size} onChange={(e) => setSize(e.target.value)} className="lg-input lg-focus text-xs rounded-lg px-2 py-1.5 mb-3">
          {colorObj.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center justify-between mt-auto">
          <span className="lg-display text-lg" style={{ color: COLORS.aubergine }}>{money(product.price)}</span>
          <button onClick={() => onAdd(product, colorObj.color, size)} className="lg-btn lg-btn-outline lg-focus text-[11px] px-3 py-1.5 rounded-full">
            \u0414\u043e\u0434\u0430\u0442\u0438
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Checkout modal ----------------------------- */
function CheckoutModal({ total, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", phone: "", city: "", branch: "", payment: "card", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 1 && /^[\d+][\d\s()+-]{8,}$/.test(form.phone.trim()) && form.city.trim().length > 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) { setError("\u0417\u0430\u043f\u043e\u0432\u043d\u0456\u0442\u044c \u0456\u043c'\u044f, \u0442\u0435\u043b\u0435\u0444\u043e\u043d \u0456 \u043c\u0456\u0441\u0442\u043e \u043a\u043e\u0440\u0435\u043a\u0442\u043d\u043e."); return; }
    setError("");
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-lg rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto" style={{ background: COLORS.card }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="lg-display text-2xl" style={{ color: COLORS.aubergine }}>\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u043d\u044f \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f</h3>
          <button type="button" onClick={onClose} className="lg-focus" aria-label="\u0417\u0430\u043a\u0440\u0438\u0442\u0438"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs opacity-70">\u0406\u043c'\u044f \u0442\u0430 \u043f\u0440\u0456\u0437\u0432\u0438\u0449\u0435</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs opacity-70">\u0422\u0435\u043b\u0435\u0444\u043e\u043d</label>
            <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+380 XX XXX XX XX" className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-70">\u041c\u0456\u0441\u0442\u043e</label>
              <input required value={form.city} onChange={(e) => update("city", e.target.value)} className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs opacity-70">\u0412\u0456\u0434\u0434\u0456\u043b\u0435\u043d\u043d\u044f \u041d\u043e\u0432\u043e\u0457 \u043f\u043e\u0448\u0442\u0438</label>
              <input value={form.branch} onChange={(e) => update("branch", e.target.value)} className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1.5">\u041e\u043f\u043b\u0430\u0442\u0430</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => update("payment", "card")} className={"lg-chip lg-focus rounded-lg px-3 py-2 text-xs text-left" + (form.payment === "card" ? " active" : "")}>
                \u041a\u0430\u0440\u0442\u043a\u043e\u044e \u043e\u043d\u043b\u0430\u0439\u043d
              </button>
              <button type="button" onClick={() => update("payment", "cod")} className={"lg-chip lg-focus rounded-lg px-3 py-2 text-xs text-left" + (form.payment === "cod" ? " active" : "")}>
                \u041d\u0430\u043a\u043b\u0430\u0434\u0435\u043d\u0438\u0439 \u043f\u043b\u0430\u0442\u0456\u0436
              </button>
            </div>
            {form.payment === "card" && (
              <p className="text-[11px] opacity-60 mt-1.5">
                \u0423 \u0446\u044c\u043e\u043c\u0443 \u043f\u0440\u043e\u0442\u043e\u0442\u0438\u043f\u0456 \u043e\u043f\u043b\u0430\u0442\u0430 \u043a\u0430\u0440\u0442\u043a\u043e\u044e \u0444\u0456\u043a\u0441\u0443\u0454\u0442\u044c\u0441\u044f \u044f\u043a \u00ab\u043e\u0447\u0456\u043a\u0443\u0454 \u043e\u043f\u043b\u0430\u0442\u0438\u00bb \u2014 \u0440\u0435\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u043b\u0430\u0442\u0456\u0436\u043d\u0438\u0439 \u0448\u043b\u044e\u0437 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0430\u0454\u0442\u044c\u0441\u044f \u043d\u0430 \u0435\u0442\u0430\u043f\u0456 \u0437\u0430\u043f\u0443\u0441\u043a\u0443 \u0441\u0430\u0439\u0442\u0443.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs opacity-70">\u041a\u043e\u043c\u0435\u043d\u0442\u0430\u0440 \u0434\u043e \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f (\u043d\u0435\u043e\u0431\u043e\u0432'\u044f\u0437\u043a\u043e\u0432\u043e)</label>
            <textarea value={form.comment} onChange={(e) => update("comment", e.target.value)} rows={2} className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mt-1 resize-none" />
          </div>
        </div>
        {error && <p className="text-xs mt-3" style={{ color: COLORS.roseDark }}>{error}</p>}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid " + COLORS.line }}>
          <span className="lg-display text-xl" style={{ color: COLORS.aubergine }}>{money(total)}</span>
          <button disabled={submitting} type="submit" className="lg-btn lg-btn-primary lg-focus px-6 py-2.5 rounded-full text-sm disabled:opacity-60">
            {submitting ? "\u041e\u0444\u043e\u0440\u043c\u043b\u044e\u0454\u043c\u043e\u2026" : "\u041f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmationModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl p-8 text-center" style={{ background: COLORS.card }}>
        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: COLORS.aubergine }}>
          <Check size={22} color={COLORS.base} />
        </div>
        <h3 className="lg-display text-2xl mb-2" style={{ color: COLORS.aubergine }}>\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043f\u0440\u0438\u0439\u043d\u044f\u0442\u043e</h3>
        <p className="text-sm opacity-70 mb-1">\u041d\u043e\u043c\u0435\u0440 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f:</p>
        <p className="text-xs font-mono opacity-60 mb-4">{order.id}</p>
        <p className="text-sm opacity-70 mb-6">\u041c\u0438 \u0437\u0432'\u044f\u0436\u0435\u043c\u043e\u0441\u044c \u0456\u0437 \u0432\u0430\u043c\u0438 \u0437\u0430 \u043d\u043e\u043c\u0435\u0440\u043e\u043c {order.customer.phone} \u0434\u043b\u044f \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f.</p>
        <button onClick={onClose} className="lg-btn lg-btn-primary lg-focus w-full py-3 rounded-full text-sm">\u041f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438 \u043f\u043e\u043a\u0443\u043f\u043a\u0438</button>
      </div>
    </div>
  );
}

/* --------------------------------- Admin UI -------------------------------- */
const ADMIN_PASSCODE = "1234";

function Admin({ goShop }) {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.storage.list("order:", true);
      const keys = (list && list.keys) || [];
      const results = [];
      for (const k of keys) {
        try {
          const res = await window.storage.get(k, true);
          if (res && res.value) results.push(JSON.parse(res.value));
        } catch (e) { /* skip unreadable key */ }
      }
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(results);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authed) loadOrders(); }, [authed, loadOrders]);

  const setStatus = async (order, status) => {
    const updated = { ...order, status };
    try {
      await window.storage.set("order:" + order.id, JSON.stringify(updated), true);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (e) {
      console.error("\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u043d\u043e\u0432\u0438\u0442\u0438 \u0441\u0442\u0430\u0442\u0443\u0441", e);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlobalStyle />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passInput === ADMIN_PASSCODE) setAuthed(true);
            else setError("\u041d\u0435\u0432\u0456\u0440\u043d\u0438\u0439 \u043a\u043e\u0434 \u0434\u043e\u0441\u0442\u0443\u043f\u0443.");
          }}
          className="lg-card rounded-2xl p-8 w-full max-w-sm"
        >
          <Lock size={20} color={COLORS.aubergine} className="mb-3" />
          <h2 className="lg-display text-2xl mb-1" style={{ color: COLORS.aubergine }}>\u041f\u0430\u043d\u0435\u043b\u044c \u0430\u0434\u043c\u0456\u043d\u0456\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430</h2>
          <p className="text-xs opacity-60 mb-4">\u0414\u0435\u043c\u043e-\u0434\u043e\u0441\u0442\u0443\u043f. \u041a\u043e\u0434: 1234</p>
          <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} className="lg-input lg-focus w-full rounded-lg px-3 py-2 text-sm mb-3" placeholder="\u041a\u043e\u0434 \u0434\u043e\u0441\u0442\u0443\u043f\u0443" />
          {error && <p className="text-xs mb-3" style={{ color: COLORS.roseDark }}>{error}</p>}
          <button type="submit" className="lg-btn lg-btn-primary lg-focus w-full py-2.5 rounded-full text-sm mb-2">\u0423\u0432\u0456\u0439\u0442\u0438</button>
          <button type="button" onClick={goShop} className="lg-focus w-full text-xs opacity-60 flex items-center justify-center gap-1 py-2">
            <ChevronLeft size={13} /> \u041f\u043e\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044c \u0443 \u043c\u0430\u0433\u0430\u0437\u0438\u043d
          </button>
        </form>
      </div>
    );
  }

  const statusIcon = (s) => {
    if (s === "\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e") return <CheckCircle2 size={14} />;
    if (s === "\u0421\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u043e") return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="min-h-screen px-5 py-8 max-w-4xl mx-auto">
      <GlobalStyle />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="lg-display text-3xl" style={{ color: COLORS.aubergine }}>\u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f</h2>
          <p className="text-xs opacity-60 mt-1">{orders ? orders.length + " \u0432\u0441\u044c\u043e\u0433\u043e" : "\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f\u2026"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} className="lg-btn lg-btn-outline lg-focus px-4 py-2 rounded-full text-xs">\u041e\u043d\u043e\u0432\u0438\u0442\u0438</button>
          <button onClick={goShop} className="lg-focus px-4 py-2 rounded-full text-xs flex items-center gap-1" style={{ color: COLORS.roseDark }}>
            <ChevronLeft size={13} /> \u0414\u043e \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0443
          </button>
        </div>
      </div>

      <div className="rounded-xl p-3 mb-6 text-xs" style={{ background: "#FDF1E7", border: "1px solid " + COLORS.gold, color: COLORS.aubergine }}>
        \u26a0\ufe0f \u0417\u0430\u0440\u0430\u0437 \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u044e\u0442\u044c\u0441\u044f \u043b\u0438\u0448\u0435 \u0432 \u0446\u044c\u043e\u043c\u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456 \u043d\u0430 \u0446\u044c\u043e\u043c\u0443 \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u0457. \u0417\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u043a\u043b\u0456\u0454\u043d\u0442\u0456\u0432 \u0437 \u0456\u043d\u0448\u0438\u0445 \u043f\u0440\u0438\u0441\u0442\u0440\u043e\u0457\u0432 \u0442\u0443\u0442 \u043d\u0435 \u0437'\u044f\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u2014 \u0434\u043b\u044f \u0446\u044c\u043e\u0433\u043e \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u0430 \u0441\u043f\u0440\u0430\u0432\u0436\u043d\u0430 \u0431\u0430\u0437\u0430 \u0434\u0430\u043d\u0438\u0445 (\u0434\u0438\u0432. README.md).
      </div>

      {loading && <p className="text-sm opacity-60">\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u044c\u2026</p>}
      {orders && orders.length === 0 && (
        <div className="lg-card rounded-2xl p-10 text-center">
          <Package size={24} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm opacity-60">\u041f\u043e\u043a\u0438 \u0449\u043e \u043d\u0435\u043c\u0430\u0454 \u0436\u043e\u0434\u043d\u043e\u0433\u043e \u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d\u043d\u044f.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders && orders.map((o) => (
          <div key={o.id} className="lg-card rounded-2xl p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium">{o.customer.name} \u00b7 {o.customer.phone}</p>
                <p className="text-xs opacity-60 mt-0.5">{o.customer.city}{o.customer.branch ? ", \u0432\u0456\u0434\u0434\u0456\u043b\u0435\u043d\u043d\u044f " + o.customer.branch : ""}</p>
                <p className="text-[11px] opacity-45 mt-1">{new Date(o.createdAt).toLocaleString("uk-UA")} \u00b7 {o.customer.payment === "card" ? "\u041e\u043f\u043b\u0430\u0442\u0430 \u043a\u0430\u0440\u0442\u043a\u043e\u044e" : "\u041d\u0430\u043a\u043b\u0430\u0434\u0435\u043d\u0438\u0439 \u043f\u043b\u0430\u0442\u0456\u0436"}</p>
              </div>
              <span className="lg-display text-lg" style={{ color: COLORS.aubergine }}>{money(o.total)}</span>
            </div>
            <ul className="mt-3 text-xs opacity-75 space-y-1">
              {o.items.map((it) => (
                <li key={it.key}>{it.qty}\u00d7 {it.name} ({it.article}) \u2014 {it.color}, {it.size}</li>
              ))}
            </ul>
            {o.customer.comment && <p className="text-xs opacity-60 mt-2 italic">\u00ab{o.customer.comment}\u00bb</p>}
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid " + COLORS.line }}>
              <span className="text-[11px] flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: COLORS.base, color: COLORS.roseDark }}>
                {statusIcon(o.status)} {o.status}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setStatus(o, "\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e")} className="lg-btn lg-btn-outline lg-focus text-[11px] px-3 py-1.5 rounded-full">\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e</button>
                <button onClick={() => setStatus(o, "\u0421\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u043e")} className="lg-focus text-[11px] px-3 py-1.5 rounded-full" style={{ color: COLORS.roseDark }}>\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
