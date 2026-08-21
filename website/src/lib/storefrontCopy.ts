import type { Locale } from "@/lib/i18n";

type StorefrontCopy = {
  cart: {
    title: string;
    empty: string;
    continue: string;
    checkout: string;
    subtotal: string;
    viewCart: string;
    qty: string;
    decrease: string;
    increase: string;
    remove: string;
    unitPrice: string;
    items: string;
  };
  checkout: {
    kicker: string;
    title: string;
    intro: string;
    fullName: string;
    email: string;
    phone: string;
    mbwayPhone: string;
    delivery: string;
    pickup: string;
    ship: string;
    address: string;
    addressDetails: string;
    postalCode: string;
    city: string;
    country: string;
    billingSame: string;
    billingAddress: string;
    billingDetails: string;
    billingPostal: string;
    billingCity: string;
    billingCountry: string;
    nif: string;
    nifHelp: string;
    invalidNif: string;
    payment: string;
    coupon: string;
    applyCoupon: string;
    couponApplied: string;
    couponInvalid: string;
    couponDiscount: string;
    notes: string;
    marketing: string;
    confirm: string;
    creating: string;
    comingSoon: string;
    summary: string;
    emptyCart: string;
    orderCreated: string;
    needAddress: string;
    needBilling: string;
    needMbway: string;
    paymentNotLive: string;
    failed: string;
    emailSent: string;
    canceled: string;
    freeShipping: string;
    total: string;
  };
  product: {
    add: string;
    addShort: string;
    adding: string;
    added: string;
    addFailed: string;
    details: string;
    notify: string;
    notifyOk: string;
    notifyFailed: string;
    notifyCta: string;
    inStockCount: string;
    outOfStock: string;
    name: string;
    email: string;
    phone: string;
  };
  account: {
    kicker: string;
    title: string;
    intro: string;
    hello: string;
    signOut: string;
    shopNow: string;
    profileKicker: string;
    profileIntro: string;
    fullName: string;
    birthDate: string;
    gender: string;
    customerType: string;
    mobile: string;
    preferredLanguage: string;
    country: string;
    shippingAddress: string;
    address: string;
    addressDetails: string;
    postalCode: string;
    city: string;
    billingSame: string;
    billingAddress: string;
    billingDetails: string;
    billingPostal: string;
    billingCity: string;
    billingCountry: string;
    nif: string;
    nifHelp: string;
    marketing: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    joinKicker: string;
    joinTitle: string;
    joinIntro: string;
    signIn: string;
    register: string;
    continueGoogle: string;
    createGoogle: string;
    or: string;
    emailOrUsername: string;
    password: string;
    username: string;
    ready: string;
    submitFailed: string;
    preferNot: string;
    male: string;
    female: string;
    nonBinary: string;
  };
};

export const storefrontCopy: Record<Locale, StorefrontCopy> = {
  pt: {
    cart: {
      title: "Carrinho",
      empty: "O teu carrinho está vazio.",
      continue: "Continuar a comprar",
      checkout: "Checkout",
      subtotal: "Subtotal",
      viewCart: "Ver carrinho",
      qty: "Qtd",
      decrease: "Diminuir quantidade",
      increase: "Aumentar quantidade",
      remove: "Remover",
      unitPrice: "Preço",
      items: "artigos",
    },
    checkout: {
      kicker: "Checkout",
      title: "Finalizar compra",
      intro: "Compra como convidado ou com conta. Podes pagar online e levantar na loja em Carcavelos.",
      fullName: "Nome completo",
      email: "Email",
      phone: "Telemóvel",
      mbwayPhone: "Telemóvel MB WAY",
      delivery: "Entrega",
      pickup: "Pagar online e levantar na loja",
      ship: "Enviar para morada",
      address: "Morada",
      addressDetails: "Detalhes morada",
      postalCode: "Código postal",
      city: "Cidade",
      country: "País",
      billingSame: "Morada de faturação igual à morada de entrega",
      billingAddress: "Morada de faturação",
      billingDetails: "Detalhes morada de faturação",
      billingPostal: "Código postal faturação",
      billingCity: "Cidade faturação",
      billingCountry: "País faturação",
      nif: "NIF (opcional)",
      nifHelp: "Se quiseres fatura com o teu número fiscal, indica o NIF.",
      invalidNif: "Indica um NIF português de 9 dígitos ou um NIF/VAT europeu válido.",
      payment: "Pagamento",
      coupon: "Cupão de atleta",
      applyCoupon: "Aplicar cupão",
      couponApplied: "aplicado",
      couponInvalid: "Cupão inválido.",
      couponDiscount: "Desconto do cupão",
      notes: "Notas para a encomenda",
      marketing: "Aceito receber novidades e lembretes de carrinho da Jhonny Surf Store.",
      confirm: "Confirmar encomenda",
      creating: "A criar encomenda…",
      comingSoon: "Em breve",
      summary: "Resumo",
      emptyCart: "O carrinho está vazio.",
      orderCreated: "Encomenda criada.",
      needAddress: "Indica a morada completa para envio: rua, código postal e cidade.",
      needBilling: "Indica a morada de faturação completa: rua, código postal e cidade.",
      needMbway: "Indica o telemóvel MB WAY para continuar.",
      paymentNotLive: "Este método ainda não está ligado. Escolhe MB WAY, Multibanco ou um pagamento Stripe.",
      failed: "Não foi possível criar a encomenda.",
      emailSent: "Enviámos também os detalhes por email.",
      canceled: "Pagamento cancelado. Podes escolher outro método e tentar outra vez.",
      freeShipping: "Portes grátis em encomendas acima de €{threshold}. Levantamento em loja é gratuito.",
      total: "Total",
    },
    product: {
      add: "Adicionar ao carrinho",
      addShort: "Adicionar",
      adding: "A adicionar...",
      added: "Produto adicionado ao carrinho.",
      addFailed: "Não foi possível adicionar ao carrinho.",
      details: "Detalhes",
      notify: "Avisar quando disponível",
      notifyOk: "Pedido registado. Avisamos-te quando voltar a estar disponível.",
      notifyFailed: "Não foi possível registar o pedido.",
      notifyCta: "Pedir aviso",
      inStockCount: "{n} em stock",
      outOfStock: "Esgotado",
      name: "Nome",
      email: "Email",
      phone: "Telefone",
    },
    account: {
      kicker: "Cliente Jhonny",
      title: "A minha conta",
      intro: "Regista-te, entra ou compra como convidado. Os dados ficam na base de clientes do website e ficam preparados para sincronização com Odoo.",
      hello: "Olá",
      signOut: "Sair",
      shopNow: "Ir às compras",
      profileKicker: "Perfil",
      profileIntro: "Mantém os teus dados prontos para checkouts mais rápidos e fatura com NIF.",
      fullName: "Nome completo",
      birthDate: "Data de nascimento",
      gender: "Género",
      customerType: "Tipo de cliente",
      mobile: "Telemóvel",
      preferredLanguage: "Idioma preferido",
      country: "País",
      shippingAddress: "Morada de entrega",
      address: "Morada",
      addressDetails: "Apartamento, andar, notas",
      postalCode: "Código postal",
      city: "Cidade",
      billingSame: "Morada de faturação igual à morada de entrega",
      billingAddress: "Morada de faturação",
      billingDetails: "Detalhes morada de faturação",
      billingPostal: "Código postal faturação",
      billingCity: "Cidade faturação",
      billingCountry: "País faturação",
      nif: "NIF (opcional)",
      nifHelp: "Usamos o NIF na fatura oficial do Odoo, se o indicares.",
      marketing: "Quero receber drops, campanhas e lembretes de carrinho da Jhonny.",
      save: "Guardar perfil",
      saving: "A guardar perfil…",
      saved: "Perfil guardado. Os teus dados estão prontos para o checkout.",
      saveFailed: "Não foi possível guardar o perfil.",
      joinKicker: "Conta Jhonny",
      joinTitle: "Join the family",
      joinIntro: "Cria conta para guardar perfil, moradas, preferências e histórico. Podes continuar a comprar como convidado no checkout.",
      signIn: "Entrar",
      register: "Criar conta",
      continueGoogle: "Continuar com Google",
      createGoogle: "Criar conta com Google",
      or: "ou",
      emailOrUsername: "Email ou username",
      password: "Palavra-passe",
      username: "Username",
      ready: "Conta pronta.",
      submitFailed: "Não foi possível concluir o pedido.",
      preferNot: "Prefiro não dizer",
      male: "Masculino",
      female: "Feminino",
      nonBinary: "Não binário",
    },
  },
  en: {
    cart: {
      title: "Cart",
      empty: "Your cart is empty.",
      continue: "Continue shopping",
      checkout: "Checkout",
      subtotal: "Subtotal",
      viewCart: "View cart",
      qty: "Qty",
      decrease: "Decrease quantity",
      increase: "Increase quantity",
      remove: "Remove",
      unitPrice: "Price",
      items: "items",
    },
    checkout: {
      kicker: "Checkout",
      title: "Complete your order",
      intro: "Checkout as a guest or with an account. Pay online and pick up in Carcavelos, or ship to your address.",
      fullName: "Full name",
      email: "Email",
      phone: "Mobile",
      mbwayPhone: "MB WAY mobile",
      delivery: "Delivery",
      pickup: "Pay online and pick up in store",
      ship: "Ship to address",
      address: "Address",
      addressDetails: "Address details",
      postalCode: "Postal code",
      city: "City",
      country: "Country",
      billingSame: "Billing address same as shipping",
      billingAddress: "Billing address",
      billingDetails: "Billing address details",
      billingPostal: "Billing postal code",
      billingCity: "Billing city",
      billingCountry: "Billing country",
      nif: "Tax ID / NIF (optional)",
      nifHelp: "Add your fiscal number if you want the invoice issued with it.",
      invalidNif: "Enter a 9-digit Portuguese NIF or a valid EU VAT number.",
      payment: "Payment",
      coupon: "Athlete coupon",
      applyCoupon: "Apply coupon",
      couponApplied: "applied",
      couponInvalid: "Invalid coupon.",
      couponDiscount: "Coupon discount",
      notes: "Order notes",
      marketing: "I agree to receive news and cart reminders from Jhonny Surf Store.",
      confirm: "Place order",
      creating: "Creating order…",
      comingSoon: "Coming soon",
      summary: "Summary",
      emptyCart: "Your cart is empty.",
      orderCreated: "Order created.",
      needAddress: "Enter the full shipping address: street, postal code and city.",
      needBilling: "Enter the full billing address: street, postal code and city.",
      needMbway: "Enter the MB WAY mobile number to continue.",
      paymentNotLive: "This method is not live yet. Choose MB WAY, Multibanco or a Stripe payment.",
      failed: "Could not create the order.",
      emailSent: "We also sent the details by email.",
      canceled: "Payment canceled. You can choose another method and try again.",
      freeShipping: "Free shipping on orders over €{threshold}. In-store pickup is free.",
      total: "Total",
    },
    product: {
      add: "Add to cart",
      addShort: "Add",
      adding: "Adding...",
      added: "Added to cart.",
      addFailed: "Could not add to cart.",
      details: "Details",
      notify: "Notify me when available",
      notifyOk: "Request saved. We’ll email you when it’s back.",
      notifyFailed: "Could not save the request.",
      notifyCta: "Notify me",
      inStockCount: "{n} in stock",
      outOfStock: "Out of stock",
      name: "Name",
      email: "Email",
      phone: "Phone",
    },
    account: {
      kicker: "Jhonny customer",
      title: "My account",
      intro: "Register, sign in, or shop as a guest. Your details stay on the website customer base and are ready for Odoo sync.",
      hello: "Hi",
      signOut: "Sign out",
      shopNow: "Go shopping",
      profileKicker: "Profile",
      profileIntro: "Keep your details ready for faster checkouts and invoices with NIF.",
      fullName: "Full name",
      birthDate: "Birth date",
      gender: "Gender",
      customerType: "Customer type",
      mobile: "Mobile",
      preferredLanguage: "Preferred language",
      country: "Country",
      shippingAddress: "Shipping address",
      address: "Address",
      addressDetails: "Apartment, floor, notes",
      postalCode: "Postal code",
      city: "City",
      billingSame: "Billing address is the same as shipping address",
      billingAddress: "Billing address",
      billingDetails: "Billing address details",
      billingPostal: "Billing postal code",
      billingCity: "Billing city",
      billingCountry: "Billing country",
      nif: "Tax ID / NIF (optional)",
      nifHelp: "We put this on the official Odoo invoice when you provide it.",
      marketing: "I want to receive Jhonny drops, campaigns, and cart reminders.",
      save: "Save profile",
      saving: "Saving profile…",
      saved: "Profile saved. Your details are ready for checkout.",
      saveFailed: "Could not save your profile.",
      joinKicker: "Jhonny account",
      joinTitle: "Join the family",
      joinIntro: "Create an account to save your profile, addresses, preferences, and order history. You can still shop as a guest at checkout.",
      signIn: "Sign in",
      register: "Create account",
      continueGoogle: "Continue with Google",
      createGoogle: "Create account with Google",
      or: "or",
      emailOrUsername: "Email or username",
      password: "Password",
      username: "Username",
      ready: "Account ready.",
      submitFailed: "Could not complete the request.",
      preferNot: "Prefer not to say",
      male: "Male",
      female: "Female",
      nonBinary: "Non-binary",
    },
  },
  zh: {
    cart: {
      title: "购物车",
      empty: "购物车是空的。",
      continue: "继续购物",
      checkout: "结账",
      subtotal: "小计",
      viewCart: "查看购物车",
      qty: "数量",
      decrease: "减少数量",
      increase: "增加数量",
      remove: "移除",
      unitPrice: "单价",
      items: "件",
    },
    checkout: {
      kicker: "结账",
      title: "完成订单",
      intro: "可以游客结账或使用账户。可在线支付后到卡卡维洛斯取货，或配送到地址。",
      fullName: "姓名",
      email: "邮箱",
      phone: "手机",
      mbwayPhone: "MB WAY 手机号",
      delivery: "配送",
      pickup: "在线支付，到店自取",
      ship: "配送到地址",
      address: "地址",
      addressDetails: "地址补充",
      postalCode: "邮编",
      city: "城市",
      country: "国家",
      billingSame: "发票地址与收货地址相同",
      billingAddress: "发票地址",
      billingDetails: "发票地址补充",
      billingPostal: "发票邮编",
      billingCity: "发票城市",
      billingCountry: "发票国家",
      nif: "税号 / NIF（可选）",
      nifHelp: "如需发票填写税号，请在此输入。",
      invalidNif: "请输入 9 位葡萄牙税号或有效的欧盟增值税号。",
      payment: "支付",
      coupon: "运动员优惠码",
      applyCoupon: "使用优惠码",
      couponApplied: "已使用",
      couponInvalid: "优惠码无效。",
      couponDiscount: "优惠码折扣",
      notes: "订单备注",
      marketing: "我同意接收 Jhonny Surf Store 的新闻和购物车提醒。",
      confirm: "确认订单",
      creating: "正在创建订单…",
      comingSoon: "即将推出",
      summary: "摘要",
      emptyCart: "购物车是空的。",
      orderCreated: "订单已创建。",
      needAddress: "请填写完整收货地址：街道、邮编和城市。",
      needBilling: "请填写完整发票地址：街道、邮编和城市。",
      needMbway: "请填写 MB WAY 手机号以继续。",
      paymentNotLive: "该支付方式尚未开通。请选择 MB WAY、Multibanco 或 Stripe。",
      failed: "无法创建订单。",
      emailSent: "我们也已通过电子邮件发送详情。",
      canceled: "支付已取消。你可以选择其他方式再试一次。",
      freeShipping: "订单满 €{threshold} 免运费。到店自取免费。",
      total: "总计",
    },
    product: {
      add: "加入购物车",
      addShort: "加入",
      adding: "正在加入...",
      added: "已加入购物车。",
      addFailed: "无法加入购物车。",
      details: "详情",
      notify: "有货时通知我",
      notifyOk: "已登记。到货后我们会通知你。",
      notifyFailed: "无法登记请求。",
      notifyCta: "登记通知",
      inStockCount: "{n} 件库存",
      outOfStock: "缺货",
      name: "姓名",
      email: "邮箱",
      phone: "电话",
    },
    account: {
      kicker: "Jhonny 客户",
      title: "我的账户",
      intro: "可以注册、登录，或以游客身份购物。资料会保存在网站客户库，并准备同步到 Odoo。",
      hello: "你好",
      signOut: "退出",
      shopNow: "去购物",
      profileKicker: "个人资料",
      profileIntro: "保存资料以便更快结账，并在发票上填写税号。",
      fullName: "姓名",
      birthDate: "出生日期",
      gender: "性别",
      customerType: "客户类型",
      mobile: "手机",
      preferredLanguage: "首选语言",
      country: "国家",
      shippingAddress: "收货地址",
      address: "地址",
      addressDetails: "公寓、楼层、备注",
      postalCode: "邮编",
      city: "城市",
      billingSame: "发票地址与收货地址相同",
      billingAddress: "发票地址",
      billingDetails: "发票地址补充",
      billingPostal: "发票邮编",
      billingCity: "发票城市",
      billingCountry: "发票国家",
      nif: "税号 / NIF（可选）",
      nifHelp: "如填写，我们会把它写在 Odoo 正式发票上。",
      marketing: "我想接收 Jhonny 新品、活动和购物车提醒。",
      save: "保存资料",
      saving: "正在保存…",
      saved: "资料已保存，可用于结账。",
      saveFailed: "无法保存资料。",
      joinKicker: "Jhonny 账户",
      joinTitle: "Join the family",
      joinIntro: "创建账户以保存资料、地址、偏好和订单记录。结账时仍可以游客身份购物。",
      signIn: "登录",
      register: "创建账户",
      continueGoogle: "使用 Google 继续",
      createGoogle: "使用 Google 创建账户",
      or: "或",
      emailOrUsername: "邮箱或用户名",
      password: "密码",
      username: "用户名",
      ready: "账户已就绪。",
      submitFailed: "无法完成请求。",
      preferNot: "不愿透露",
      male: "男",
      female: "女",
      nonBinary: "非二元",
    },
  },
};

export function storefrontText(locale: Locale) {
  return storefrontCopy[locale] || storefrontCopy.en;
}
