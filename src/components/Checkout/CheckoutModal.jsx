import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Check, 
  ArrowRight, 
  User, 
  Smartphone, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  Coins, 
  Truck, 
  ShoppingBag,
  Home,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  CheckCircle2,
  Building2,
  Plus,
  Edit,
  Compass,
  Navigation,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
  Tag,
  Gift,
  Percent,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { shopApi } from "../../api";
import { storage } from "../../lib/storage";
import InteractiveMap from "./InteractiveMap";
import CheckoutAddressStep from "./CheckoutAddressStep";
import CheckoutPaymentStep from "./CheckoutPaymentStep";
import { matchGovernorateZone } from "../../lib/geoService";
import CheckoutReviewStep from "./CheckoutReviewStep";

// Firebase imports
import { auth } from "../../lib/firebase";
import { createOrderInFirestore, updateUserProfile, getCouponsFromFirestore, saveCouponsToFirestore, getShippingRatesFromFirestore, saveAbandonedCartToFirestore, deleteAbandonedCartFromFirestore } from "../../lib/firebaseService";
import { emailApi } from "../../lib/emailApi";
import { stockService } from "../../lib/stockService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { calculateCouponDiscount, validateCoupon } from "../../lib/discountUtils";

export default function CheckoutModal(props) {
  const {
    isOpen = false,
    onClose = () => {},
    cartItems = props.cart || [],
    clearCart = () => {},
    onOrderSuccess = () => {},
    storeCurrency = "ج.م",
    user = props.currentUser,
    onUpdateUser = () => {},
    lang = "ar",
    triggerToast = () => {}
  } = props;
  useBodyScrollLock(isOpen);
  const [step, setStep] = useState(1);
  
  // Unified Parameter Object structure (Martin Fowler's Introduce Parameter Object)
  const [shippingDetails, setShippingDetails] = useState(() => ({
    name: storage.getCheckoutField("name", "") || user?.name || "",
    phone: storage.getCheckoutField("phone", "") || user?.phone || "",
    email: storage.getCheckoutField("email", "") || user?.email || auth.currentUser?.email || "",
    governorate: storage.getCheckoutField("governorate", "القاهرة") || "القاهرة",
    address: "",
    notes: storage.getCheckoutField("notes", "")
  }));

  // Backward compatible setters that update the unified parameter object
  const setName = (val) => setShippingDetails(prev => ({ ...prev, name: val }));
  const setPhone = (val) => setShippingDetails(prev => ({ ...prev, phone: val }));
  const setAddress = (val) => setShippingDetails(prev => ({ ...prev, address: val }));
  const setNotes = (val) => setShippingDetails(prev => ({ ...prev, notes: val }));
  const setEmail = (val) => setShippingDetails(prev => ({ ...prev, email: val }));
  const setGovernorate = (val) => setShippingDetails(prev => ({ ...prev, governorate: val }));

  // Deconstruct for easy local usage inside this component
  const { name, phone, address, notes, email, governorate } = shippingDetails;

  useEffect(() => {
    storage.setCheckoutField("notes", notes);
  }, [notes]);

  // Sync abandoned cart when checkout modal opens or user details change
  useEffect(() => {
    if (isOpen && cartItems && cartItems.length > 0) {
      const activeUser = user || storage.getCurrentUser();
      const cartId = activeUser?.uid || phone || `cart_${Date.now()}`;
      saveAbandonedCartToFirestore({
        id: cartId,
        customerName: name || activeUser?.name || "زائر المتجر",
        customerPhone: phone || activeUser?.phone || "",
        customerEmail: email || activeUser?.email || "",
        governorate: governorate || "القاهرة",
        items: cartItems,
        total: cartItems.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 1)), 0)
      });
    }
  }, [isOpen, name, phone, governorate, cartItems, user]);

  const [storeConfig, setStoreConfig] = useState({
    storeName: "المتجر الإلكتروني",
    storeLogo: ""
  });

  const [shippingConfig, setShippingConfig] = useState({ zones: [], freeShippingMin: 0 });

  // Sync with user prop or local user storage whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const activeUser = user || storage.getCurrentUser();
      if (activeUser) {
        setShippingDetails(prev => ({
          ...prev,
          name: activeUser.name || prev.name || "",
          phone: activeUser.phone || prev.phone || "",
          email: activeUser.email || prev.email || auth.currentUser?.email || "",
          address: activeUser.address || prev.address || ""
        }));
        if (activeUser.addresses && activeUser.addresses.length > 0) {
          setAddresses(activeUser.addresses);
          if (!selectedAddressId || !activeUser.addresses.some(a => a.id === selectedAddressId)) {
            setSelectedAddressId(activeUser.addresses[0].id);
            setAddress(activeUser.addresses[0].details || activeUser.address || "");
          }
        } else if (activeUser.address) {
          setAddress(activeUser.address);
        }
      }
    }
  }, [isOpen, user]);

  const [addresses, setAddresses] = useState(() => {
    const activeUser = user || storage.getCurrentUser();
    if (activeUser?.addresses && activeUser.addresses.length > 0) {
      return activeUser.addresses;
    }
    return storage.getSavedAddresses() || [];
  });
  
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const activeUser = user || storage.getCurrentUser();
    const activeList = (activeUser?.addresses && activeUser.addresses.length > 0) ? activeUser.addresses : (storage.getSavedAddresses() || []);
    
    if (activeUser?.address && activeList.length > 0) {
      const found = activeList.find(addr => addr.details === activeUser.address);
      if (found) return found.id;
    }
    if (activeList && activeList.length > 0) return activeList[0].id;
    return "";
  });
  
  const [mainCoords, setMainCoords] = useState({ lat: 30.0444, lng: 31.2357 });
  const [modalCoords, setModalCoords] = useState({ lat: 30.0444, lng: 31.2357 });
  const submittingRef = useRef(false);

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddressTitle, setNewAddressTitle] = useState("");
  const [newAddressDetails, setNewAddressDetails] = useState("");
  const [newAddressType, setNewAddressType] = useState("home"); // "home" | "work" | "other"

  useEffect(() => {
    storage.setCheckoutField("name", name);
  }, [name]);

  useEffect(() => {
    storage.setCheckoutField("phone", phone);
  }, [phone]);

  useEffect(() => {
    const activeUser = user || storage.getCurrentUser();
    if (activeUser?.addresses) {
      setAddresses(activeUser.addresses);
      const activeList = activeUser.addresses;
      if (activeUser.address && activeList.length > 0) {
        const found = activeList.find(addr => addr.details === activeUser.address);
        if (found) {
          setSelectedAddressId(found.id);
        }
      }
    }
  }, [user?.addresses, user?.address]);

  useEffect(() => {
    storage.setSavedAddresses(addresses);
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses]);

  useEffect(() => {
    const selected = addresses.find(addr => addr.id === selectedAddressId);
    if (selected) {
      const addressText = selected.details || selected.title || "";
      setAddress(addressText);
      if (selected.lat && selected.lng) {
        setMainCoords({
          lat: selected.lat,
          lng: selected.lng
        });
      }
      // Auto-sync governorate based on address details or saved governorate
      const zones = shippingConfig?.zones && shippingConfig.zones.length > 0
        ? shippingConfig.zones
        : [
            { name: "القاهرة", price: 50 },
            { name: "الجيزة", price: 50 },
            { name: "الإسكندرية", price: 65 },
            { name: "الدقهلية", price: 70 }
          ];

      const fullAddressString = `${selected.title || ""} ${selected.details || ""} ${selected.governorate || ""}`;
      const matchedZone = matchGovernorateZone(fullAddressString, zones);
      if (matchedZone) {
        setShippingDetails(prev => ({ ...prev, governorate: matchedZone.name }));
      } else if (selected.governorate) {
        setShippingDetails(prev => ({ ...prev, governorate: selected.governorate }));
      }
    }
  }, [selectedAddressId, addresses, shippingConfig]);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod", "wallet"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);
  const [placedOrderItems, setPlacedOrderItems] = useState([]);
  const [placedOrderSubtotal, setPlacedOrderSubtotal] = useState(0);
  const [placedOrderCouponDiscount, setPlacedOrderCouponDiscount] = useState(0);
  const [placedOrderCouponCode, setPlacedOrderCouponCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [shippingLocations, setShippingLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  
  // Coupons State
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  
  const [senderAccount, setSenderAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [copiedField, setCopiedField] = useState(""); // "vodafone" | "instapay"

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true); // Default expanded on mobile so coupons and items are instantly visible

  // Lock scroll and fetch data when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      async function initCheckout() {
        try {
          const [config, locationsList, couponsList, ratesData] = await Promise.all([
            shopApi.getPublicStoreConfig(),
            shopApi.getShippingLocations(),
            getCouponsFromFirestore().catch(() => []),
            getShippingRatesFromFirestore().catch(() => ({ zones: [], freeShippingMin: 0 }))
          ]);
          if (config) setStoreConfig(config);
          if (locationsList) setShippingLocations(locationsList);
          if (ratesData) setShippingConfig(ratesData);
          if (couponsList && Array.isArray(couponsList) && couponsList.length > 0) {
            setAvailableCoupons(couponsList);
          } else {
            setAvailableCoupons([]);
          }
        } catch (err) {
          console.error("Failed to load custom configurations:", err);
          setAvailableCoupons([]);
        }
      }
      initCheckout();
    } else {
      document.body.style.overflow = "unset";
      setCouponInput("");
      setAppliedCoupon(null);
      setCouponError("");
      setCouponSuccess("");
      setPlacedOrderCouponDiscount(0);
      setPlacedOrderCouponCode(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset steps on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSuccessOrderId(null);
      setErrorMessage("");
      setPlacedOrderTotal(0);
      setPlacedOrderItems([]);
      setPlacedOrderSubtotal(0);
    }
  }, [isOpen]);

  // Calculate subtotal reliably
  const subtotal = cartItems.reduce((acc, item) => {
    const rawP = item.price;
    const itemPrice = typeof rawP === "number" && !isNaN(rawP)
      ? rawP
      : parseFloat(String(rawP || "0").replace(/[^0-9.]/g, "")) || 0;
    const itemQty = Number(item.quantity) || 1;
    return acc + (itemPrice * itemQty);
  }, 0);

  // Calculate applied coupon discount mathematically and logically using refactored discount utility
  const couponDiscount = calculateCouponDiscount(appliedCoupon, subtotal);

  // Calculate dynamic delivery cost based on selected governorate and shipping configuration from Firestore
  const currentGovName = shippingDetails?.governorate || "القاهرة";
  const matchedZone = shippingConfig.zones?.find(
    z => z.name === currentGovName || z.id === selectedLocationId
  );
  const isShippingUnavailable = matchedZone && matchedZone.active === false;
  const rawDeliveryCost = matchedZone ? Number(matchedZone.price) || 0 : 50;

  let deliveryCost = rawDeliveryCost;
  if (shippingConfig.freeShippingMin > 0 && subtotal >= shippingConfig.freeShippingMin) {
    deliveryCost = 0;
  }

  const tax = 0;
  const total = Math.max(0, Math.round((subtotal - couponDiscount + deliveryCost) * 100) / 100);

  const handleApplyCoupon = (codeToApply) => {
    setCouponError("");
    setCouponSuccess("");
    const targetCode = (codeToApply || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError("يرجى إدخال كود الكوبون أولاً.");
      return;
    }

    const found = availableCoupons.find(
      (c) => c.code && c.code.trim().toUpperCase() === targetCode
    );

    const checkResult = validateCoupon(found, subtotal, storeCurrency);
    if (!checkResult.valid) {
      setCouponError(checkResult.message);
      return;
    }

    setAppliedCoupon(found);
    setCouponInput(found.code);
    setCouponSuccess(`تم تطبيق الكوبون (${found.code}) بنجاح!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const closeAddressModal = () => {
    setIsAddAddressOpen(false);
    setEditingAddressId(null);
    setNewAddressTitle("");
    setNewAddressDetails("");
    setNewAddressType("home");
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    const updated = addresses.filter(addr => addr.id !== id);
    setAddresses(updated);
    
    let nextSelectedId = selectedAddressId;
    if (selectedAddressId === id && updated.length > 0) {
      nextSelectedId = updated[0].id;
      setSelectedAddressId(nextSelectedId);
    } else if (updated.length === 0) {
      nextSelectedId = "";
      setSelectedAddressId("");
    }

    storage.setSavedAddresses(updated);

    const activeSelectedAddr = updated.find(a => a.id === nextSelectedId);
    const nextDetails = activeSelectedAddr ? activeSelectedAddr.details : "";

    const activeUser = user || storage.getCurrentUser();
    if (activeUser) {
      const updatedProfile = {
        ...activeUser,
        address: nextDetails,
        addresses: updated
      };
      if (onUpdateUser) {
        onUpdateUser(updatedProfile);
      } else {
        storage.setCurrentUser(updatedProfile);
        if (auth.currentUser) {
          try {
            await updateUserProfile(auth.currentUser.uid, {
              address: nextDetails,
              addresses: updated
            });
          } catch (err) {
            console.error("Failed to sync deleted address to Firestore:", err);
          }
        }
      }
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddressTitle.trim() || !newAddressDetails.trim()) {
      return;
    }
    
    let updated;
    let nextSelectedId;
    if (editingAddressId) {
      updated = addresses.map(addr => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            title: newAddressTitle.trim(),
            details: newAddressDetails.trim(),
            type: newAddressType,
            lat: modalCoords.lat,
            lng: modalCoords.lng
          };
        }
        return addr;
      });
      setAddresses(updated);
      nextSelectedId = editingAddressId;
      setSelectedAddressId(nextSelectedId);
      setEditingAddressId(null);
    } else {
      const newAddressObj = {
        id: "addr_" + Date.now(),
        title: newAddressTitle.trim(),
        details: newAddressDetails.trim(),
        type: newAddressType,
        lat: modalCoords.lat,
        lng: modalCoords.lng
      };
      updated = [...addresses, newAddressObj];
      setAddresses(updated);
      nextSelectedId = newAddressObj.id;
      setSelectedAddressId(nextSelectedId);
    }
    
    storage.setSavedAddresses(updated);

    const activeSelectedAddr = updated.find(a => a.id === nextSelectedId);
    const nextDetails = activeSelectedAddr ? activeSelectedAddr.details : "";

    const activeUser = user || storage.getCurrentUser();
    if (activeUser) {
      const updatedProfile = {
        ...activeUser,
        address: nextDetails,
        addresses: updated
      };
      if (onUpdateUser) {
        onUpdateUser(updatedProfile);
      } else {
        storage.setCurrentUser(updatedProfile);
        if (auth.currentUser) {
          try {
            await updateUserProfile(auth.currentUser.uid, {
              address: nextDetails,
              addresses: updated
            });
          } catch (err) {
            console.error("Failed to sync added address to Firestore:", err);
          }
        }
      }
    }

    // Reset form fields
    setNewAddressTitle("");
    setNewAddressDetails("");
    setNewAddressType("home");
    setIsAddAddressOpen(false);
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!name.trim()) {
      setErrorMessage("يرجى كتابة الاسم بالكامل لتثبيت الفاتورة.");
      return;
    }
    if (phone.trim().length < 10) {
      setErrorMessage("رقم الهاتف غير صحيح، يجب أن يتكون من 10 أرقام على الأقل للاتصال بك.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح لتلقي الفاتورة ومتابعة التحديثات.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("برجاء إدخال عنوان التسليم بالتفصيل أو تحديده على الخريطة ليسهل على المندوب الوصول إليك.");
      return;
    }
    if (isShippingUnavailable) {
      setErrorMessage(`عذراً، الشحن غير متاح لمحافظة (${currentGovName}) حالياً. يرجى اختيار محافظة أخرى لمتابعة الشراء.`);
      return;
    }
    setStep(2);
  };

  const handleNextToReview = () => {
    setErrorMessage("");
    setStep(3);
  };

  const handleOneClickCheckout = async () => {
    setErrorMessage("");
    if (!name.trim()) {
      setErrorMessage("يرجى كتابة الاسم بالكامل لتثبيت الفاتورة.");
      return;
    }
    if (phone.trim().length < 10) {
      setErrorMessage("رقم الهاتف غير صحيح، يجب أن يتكون من 10 أرقام على الأقل للاتصال بك.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح لتلقي الفاتورة ومتابعة التحديثات.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("برجاء إدخال عنوان التسليم بالتفصيل أو تحديده على الخريطة ليسهل على المندوب الوصول إليك.");
      return;
    }
    if (isShippingUnavailable) {
      setErrorMessage(`عذراً، الشحن غير متاح لمحافظة (${currentGovName}) حالياً. يرجى اختيار محافظة أخرى لمتابعة الشراء.`);
      return;
    }
    setPaymentMethod("cod");
    await handleSubmitOrder();
  };

  const handleSubmitOrder = async () => {
    if (isShippingUnavailable) {
      setErrorMessage(`عذراً، الشحن غير متاح لمحافظة (${currentGovName}) حالياً. لا يمكنك إكمال طلب الشراء لهذه المنطقة.`);
      setIsSubmitting(false);
      submittingRef.current = false;
      return;
    }

    if (submittingRef.current) {
      console.warn("Order submission locked - concurrent attempt blocked.");
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const itemsToSubmit = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }));

      const formattedPayment = "الدفع عند الاستلام كاش";

      // يجب أن يكون المستخدم مسجل الدخول — لا شراء بدون حساب
      const firebaseUser = auth.currentUser;
      const savedUser = storage.getCurrentUser();
      const userId = firebaseUser?.uid || savedUser?.uid;

      if (!userId) {
        setErrorMessage("يجب تسجيل الدخول أولاً لإتمام الشراء. يرجى تسجيل الدخول أو إنشاء حساب جديد.");
        setIsSubmitting(false);
        submittingRef.current = false;
        return;
      }

      const finalCoords = mainCoords || { lat: 30.0444, lng: 31.2357 };
      const googleMapsUrl = `https://www.google.com/maps?q=${finalCoords.lat},${finalCoords.lng}`;

      const orderPayload = {
        userId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        customerAddress: address.trim(),
        customerNotes: notes.trim() || "",
        governorate: currentGovName,
        shippingDetails: {
          address: address.trim(),
          governorate: currentGovName,
          coordinates: finalCoords,
          googleMapsUrl: googleMapsUrl,
          notes: notes.trim() || ""
        },
        coordinates: finalCoords,
        googleMapsUrl: googleMapsUrl,
        paymentMethod: formattedPayment,
        items: itemsToSubmit,
        total,
        shippingLocationName: currentGovName,
        shippingCost: deliveryCost,
        subtotal,
        appliedCouponCode: appliedCoupon ? appliedCoupon.code : null,
        couponDiscount: couponDiscount
      };

      // Create order in Firestore database with fallback
      let dbOrder;
      try {
        dbOrder = await createOrderInFirestore(orderPayload);
      } catch (firestoreErr) {
        console.error("Firestore order creation failed, generating local fallback:", firestoreErr);
        // Fallback to offline/local order so checkout is never blocked
        dbOrder = {
          ...orderPayload,
          orderNumber: String(Math.floor(100000 + Math.random() * 900000)),
          id: "local_" + Date.now(),
          status: "PENDING",
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString("ar-EG")
        };
      }

      // Increment coupon usage count if coupon was used
      if (appliedCoupon) {
        try {
          const updatedList = availableCoupons.map((cp) => {
            if (cp.id === appliedCoupon.id || (cp.code && cp.code.toUpperCase() === appliedCoupon.code.toUpperCase())) {
              return { ...cp, usesCount: (cp.usesCount || 0) + 1 };
            }
            return cp;
          });
          await saveCouponsToFirestore(updatedList);
        } catch (couponUpdateErr) {
          console.error("Failed to update coupon usesCount:", couponUpdateErr);
        }
      }

      // Decrement inventory stocks
      try {
        stockService.decrementStocks(itemsToSubmit);
      } catch (stockErr) {
        console.error("NileTechno Stock Manager: Error decrementing stocks:", stockErr);
      }

      // Trigger Order Confirmation Email
      const targetEmail = email || user?.email || dbOrder.customerEmail || dbOrder.email;
      const targetName = fullName || user?.displayName || dbOrder.customerName || dbOrder.name || "العميل";
      if (targetEmail) {
        emailApi.sendOrderStatusEmail(dbOrder, "CREATED", targetEmail, targetName)
          .catch(err => console.error("[CHECKOUT EMAIL ERROR]:", err));
      }

      setPlacedOrderItems([...cartItems]);
      setPlacedOrderSubtotal(subtotal);
      setPlacedOrderCouponDiscount(couponDiscount);
      setPlacedOrderCouponCode(appliedCoupon ? appliedCoupon.code : null);
      setPlacedOrderTotal(dbOrder.total);
      setSuccessOrderId(dbOrder.id);
      const activeUser = user || storage.getCurrentUser();
      const cartId = activeUser?.uid || phone;
      if (cartId) deleteAbandonedCartFromFirestore(cartId);
      clearCart();
      onOrderSuccess(dbOrder.id);
    } catch (err) {
      console.error("Order submission error:", err);
      setErrorMessage(err.message || "عذراً، فشل إرسال الطلبية. يرجى مراجعة الاتصال والتأكد من البيانات.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const renderOrderSummaryDetails = (isMobile = false) => {
    const displayItems = successOrderId ? placedOrderItems : cartItems;
    const displaySubtotal = successOrderId ? placedOrderSubtotal : subtotal;
    const displayCouponDiscount = successOrderId ? placedOrderCouponDiscount : couponDiscount;
    const displayCouponCode = successOrderId ? placedOrderCouponCode : (appliedCoupon ? appliedCoupon.code : null);
    const displayTotal = successOrderId ? placedOrderTotal : total;

    return (
      <div className={`space-y-4 ${isMobile ? "" : "h-full flex flex-col justify-between"}`}>
        <div>
          {/* Header Title */}
          {!isMobile && (
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">ملخص الطلبية</h2>
              <span className="bg-slate-200/80 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full mr-auto">
                {displayItems.length} منتجات
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className={`space-y-2.5 overflow-y-auto ${isMobile ? "max-h-[160px]" : "max-h-[240px] pr-1 scrollbar-thin scrollbar-thumb-slate-200"}`}>
            {displayItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between gap-3 bg-white hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-all duration-200"
              >
                {/* Product Image */}
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full rounded object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 text-right">
                  <h4 className="text-xs font-black text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                    الكمية: {item.quantity} × {item.price} {storeCurrency}
                  </span>
                </div>

                {/* Price */}
                <div className="text-xs font-black text-slate-900 font-mono shrink-0">
                  {item.price * item.quantity} {storeCurrency}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Input Box */}
          {!successOrderId && (
            <div className="mt-3.5 p-3.5 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span>كوبون الخصم والتخفيضات</span>
                </span>
                {appliedCoupon ? (
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    كوبون مفعّل
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200/60">
                    خصم إضافي!
                  </span>
                )}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-300/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-950 font-mono block">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] font-black text-emerald-700">
                        وفرت: -{couponDiscount} {storeCurrency}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="إزالة الكوبون"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError("");
                    }}
                    placeholder="أدخل كود الخصم (مثل: WELCOME10)"
                    className="w-full bg-white border border-slate-300/90 focus:border-blue-600 rounded-xl pr-3.5 pl-24 py-2.5 text-xs font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase shadow-2xs placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="absolute left-1 top-1 bottom-1 px-3.5 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-black transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0 z-10"
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>تطبيق</span>
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[10px] font-bold text-rose-600 pt-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
              {couponSuccess && (
                <p className="text-[10px] font-bold text-emerald-700 pt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{couponSuccess}</span>
                </p>
              )}

              {/* Available Public Coupon Chips */}
              {!appliedCoupon && availableCoupons.filter(c => c.active).length > 0 && (
                <div className="pt-1.5 border-t border-slate-200/60">
                  <span className="text-[10px] font-black text-slate-600 block mb-1">
                    💡 اضغط لاستخدام كود الخصم المتاح:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableCoupons.filter(c => c.active).slice(0, 4).map((cp) => (
                      <button
                        key={cp.id || cp.code}
                        type="button"
                        onClick={() => handleApplyCoupon(cp.code)}
                        className="text-[10px] font-mono font-black bg-white hover:bg-blue-600 hover:text-white text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1 group"
                      >
                        <Gift className="w-3 h-3 text-amber-500 group-hover:text-white" />
                        <span>{cp.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="mt-3 space-y-2 bg-white/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>مجموع المنتجات</span>
              <span className="font-mono text-slate-900 font-black">{displaySubtotal} {storeCurrency}</span>
            </div>

            {displayCouponDiscount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>خصم الكوبون ({displayCouponCode})</span>
                </span>
                <span className="font-mono font-black">-{displayCouponDiscount} {storeCurrency}</span>
              </div>
            )}
            
            <div className="border-t border-slate-100 pt-2.5 mt-1 flex justify-between items-center">
              <span className="text-xs font-black text-slate-900">إجمالي المبلغ المطلوب</span>
              <span className="text-base sm:text-lg font-black text-blue-900 font-mono">
                {displayTotal} {storeCurrency}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Delivery Info Box */}
        {!isMobile && (
          <div className="mt-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-right">
              <h4 className="text-[11px] font-black text-emerald-950">ضمان الفحص والدفع عند الاستلام</h4>
              <p className="text-[10px] font-bold text-emerald-700 mt-0.5 leading-relaxed">
                الدفع نقداً عند استلام الشحنة وتفقد جودة المنتجات بالكامل.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center" dir={lang === "ar" ? "rtl" : "ltr"}>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
          />

          {/* Main Centered Applette Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-full max-w-4xl bg-white h-full sm:h-[88vh] max-h-[820px] flex flex-col md:flex-row-reverse rounded-none sm:rounded-2xl shadow-2xl relative border border-slate-200/40 overflow-hidden isolate z-50"
          >
            {/* ==================== LEFT COLUMN: Order Summary (Persistent on Desktop) ==================== */}
            <div className="hidden md:flex md:w-[38%] bg-slate-50 border-l border-slate-150 h-full flex-col justify-between p-6 lg:p-7.5 overflow-y-auto">
              {renderOrderSummaryDetails(false)}
            </div>

            {/* ==================== RIGHT COLUMN: Checkout steps ==================== */}
            <div className="w-full md:w-[62%] h-full flex flex-col bg-white overflow-hidden">
              {/* Sticky Top Header */}
              <div className="bg-white border-b border-slate-100 py-4.5 px-6 sticky top-0 z-30 flex items-center justify-between shrink-0">
                {/* Right: Back button (if step > 1) / Spacer */}
                {step > 1 && !successOrderId ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200/50 active:scale-95 shrink-0"
                    title="رجوع للخطوة السابقة"
                  >
                    <ArrowRight className={`h-4.5 w-4.5 ${lang === "en" ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <div className="w-9 h-9 opacity-0"></div>
                )}

                {/* Center Title */}
                <h1 className="text-sm sm:text-base font-black text-slate-900 font-sans tracking-tight">
                  {successOrderId 
                    ? "تأكيد واستلام طلبك" 
                    : step === 1 
                      ? "عنوان التسليم والاتصال" 
                      : step === 2 
                        ? "طريقة تسوية الدفع" 
                        : "مراجعة وتأكيد الطلبية"
                  }
                </h1>

                {/* Left: Close Button */}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                  aria-label="إغلاق"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Collapsible Mobile Summary Accordion (Mobile Only) */}
              {!successOrderId && (
                <div className="md:hidden border-b border-blue-100 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/40 select-none shrink-0">
                  <div 
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="px-4 py-3 flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block flex items-center gap-1">
                          {isSummaryExpanded ? "ملخص المنتجات والكوبون" : "عرض المنتجات وكود الخصم"}
                          {isSummaryExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </span>
                        {appliedCoupon ? (
                          <span className="text-[10px] font-black text-emerald-700 block">
                            ✨ خصم مفعّل (-{couponDiscount} {storeCurrency})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 block flex items-center gap-1">
                            <Tag className="w-3 h-3 text-blue-600" />
                            <span>ادخل كود الخصم لتوفير أكبر 🎁</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-blue-900 font-mono block">
                        {total} {storeCurrency}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 block">
                        الإجمالي الشامل
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSummaryExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50 border-t border-slate-100 px-5 py-4"
                      >
                        {renderOrderSummaryDetails(true)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Steps Progress Bar Indicator */}
              {!successOrderId && (
                <div className="bg-white border-b border-slate-50 py-4 px-6 sm:px-12 shrink-0 select-none">
                  <div className="relative flex items-center justify-between w-full max-w-sm mx-auto">
                    {/* Progress Bar background line */}
                    <div className="absolute top-4 inset-x-0 h-0.5 bg-slate-100 -z-0" />
                    <div 
                      className="absolute top-4 right-0 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
                      style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
                    />

                    {/* Step 1 */}
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 1 
                          ? "bg-white border-2 border-blue-600 text-blue-600 shadow-sm"
                          : "bg-blue-600 text-white"
                      }`}>
                        {step > 1 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "1"}
                      </div>
                      <span className={`text-[10px] font-black mt-1.5 ${step === 1 ? "text-slate-900" : "text-slate-400 font-bold"}`}>العنوان</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 2 
                          ? "bg-white border-2 border-blue-600 text-blue-600 shadow-sm"
                          : step > 2 
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}>
                        {step > 2 ? <Check className="w-4 h-4 stroke-[2.5]" /> : "2"}
                      </div>
                      <span className={`text-[10px] font-black mt-1.5 ${step === 2 ? "text-slate-900" : "text-slate-400 font-bold"}`}>الدفع</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 3 
                          ? "bg-white border-2 border-blue-600 text-blue-600 shadow-sm"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}>
                        "3"
                      </div>
                      <span className={`text-[10px] font-black mt-1.5 ${step === 3 ? "text-slate-900" : "text-slate-400 font-bold"}`}>المراجعة</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active form screen body */}
              <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-5">
                
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-600 font-bold text-right leading-relaxed flex items-start gap-2.5 transition-all">
                    <span className="shrink-0 text-xs">⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successOrderId ? (
                  /* ========================================================
                     SUCCESS SCREEN (Stripe style premium verification card)
                     ======================================================== */
                  <div className="py-6 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-md shadow-emerald-100 mb-5 border border-emerald-100/50">
                      <Check className="w-10 h-10 text-emerald-600 stroke-[3]" />
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900">
                      {lang === "en" ? "Order Placed Successfully!" : "تم تسجيل طلبك بنجاح!"}
                    </h2>
                    
                    {/* Order Status Badge */}
                    <div className="mt-3 bg-blue-50 border border-blue-200/80 rounded-xl px-4 py-2.5 text-xs font-black text-blue-900 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <span>{lang === "en" ? "Status: Order confirmed and being prepared 📦" : "حالة الطلب: تم تأكيد الطلب وجاري التجهيز والتغليف 📦"}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                      {lang === "en" ? "Your order reference number:" : "يسعدنا خدمتك! رقم الطلب المميز الخاص بك هو:"}
                    </p>

                    <div className="font-mono text-sm font-black bg-slate-100 text-slate-950 border border-slate-200 rounded-2xl px-6 py-3 mt-2 inline-block shadow-2xs select-all">
                      {successOrderId}
                    </div>

                    {/* Delivery Timeframe Notice Box */}
                    <div className="mt-4 w-full bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-right">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-amber-800" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-950">
                          {lang === "en" ? "Estimated Delivery Time:" : "وقت تسليم الشحنة المتوقع:"}
                        </h4>
                        <p className="text-[11px] font-extrabold text-amber-800 mt-0.5">
                          {lang === "en" ? "From 1 to 7 business days max 🚚" : "من يوم واحد إلى 7 أيام عمل كحد أقصى 🚚"}
                        </p>
                      </div>
                    </div>

                    {/* Receipt brief breakdown */}
                    <div className="mt-4 w-full bg-slate-50 rounded-2xl border border-slate-200/50 p-5 space-y-3.5 text-right text-xs text-slate-700 font-bold">
                      <div className="text-slate-900 border-b border-slate-200/80 pb-3 mb-1 font-black text-xs flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-800" />
                        <span>{lang === "en" ? "Delivery Details:" : "تفاصيل عملية التسليم المعتمدة:"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-bold">{lang === "en" ? "Recipient Name:" : "اسم المستلم:"}</span>
                        <span className="text-slate-800">{name}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-bold">{lang === "en" ? "Phone Number:" : "رقم التواصل:"}</span>
                        <span className="text-slate-800 font-mono">{phone}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-bold">{lang === "en" ? "Delivery Method:" : "طريقة التوصيل:"}</span>
                        <span className="text-slate-800">{lang === "en" ? "Express Home Delivery (1-7 Days)" : "توصيل سريع للمنزل (1-7 أيام)"}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-bold">{lang === "en" ? "Address:" : "العنوان بالتفصيل:"}</span>
                        <span className="text-slate-800 truncate max-w-[200px]">{address}</span>
                      </div>

                      <div className="border-t border-slate-200/80 pt-3.5 mt-2 flex justify-between items-center">
                        <span className="text-blue-900 font-black text-sm">{placedOrderTotal || total} {storeCurrency}</span>
                        <span className="text-slate-900 font-black">{lang === "en" ? "Total Due (Cash on Delivery):" : "المبلغ المستحق للتسليم كاش:"}</span>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-4 rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      {lang === "en" ? "OK, Close & Return to Shop" : "موافق، إغلاق والعودة للمتجر"}
                    </button>
                  </div>

                ) : step === 1 ? (
                  <CheckoutAddressStep
                    shippingDetails={shippingDetails}
                    setShippingDetails={setShippingDetails}
                    shippingConfig={shippingConfig}
                    selectedLocationId={selectedLocationId}
                    setSelectedLocationId={setSelectedLocationId}
                    shippingLocations={shippingLocations}
                    storeCurrency={storeCurrency}
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    setSelectedAddressId={setSelectedAddressId}
                    setEditingAddressId={setEditingAddressId}
                    setNewAddressTitle={setNewAddressTitle}
                    setNewAddressDetails={setNewAddressDetails}
                    setNewAddressType={setNewAddressType}
                    setModalCoords={setModalCoords}
                    setIsAddAddressOpen={setIsAddAddressOpen}
                    handleDeleteAddress={handleDeleteAddress}
                    mainCoords={mainCoords}
                    setMainCoords={setMainCoords}
                    setAddresses={setAddresses}
                    handleNextToPayment={handleNextToPayment}
                    isAddAddressOpen={isAddAddressOpen}
                    closeAddressModal={closeAddressModal}
                    editingAddressId={editingAddressId}
                    handleAddNewAddress={handleAddNewAddress}
                    newAddressTitle={newAddressTitle}
                    newAddressDetails={newAddressDetails}
                    modalCoords={modalCoords}
                    newAddressType={newAddressType}
                    user={user}
                    onOneClickCheckout={handleOneClickCheckout}
                    isSubmitting={isSubmitting}
                  />
                ) : step === 2 ? (
                  <CheckoutPaymentStep
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    total={total}
                    storeCurrency={storeCurrency}
                    handleNextToReview={handleNextToReview}
                  />
                ) : (
                  <CheckoutReviewStep
                    shippingDetails={shippingDetails}
                    handleSubmitOrder={handleSubmitOrder}
                    isSubmitting={isSubmitting}
                  />
                )}

              </div>
            </div>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
}
