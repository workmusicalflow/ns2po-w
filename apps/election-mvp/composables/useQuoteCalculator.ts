/**
 * Composable pour le calcul de devis en temps réel
 * Gère la logique métier de tarification, remises et taxes
 */

import { ref, readonly } from "vue";
import type {
  QuoteRequest,
  QuoteItem,
  QuoteCalculation,
  CalculatedItem,
  AppliedRule,
  AppliedDiscount,
  PriceBreakdown,
  QuoteCalculatorOptions,
  QuoteCalculatorResult,
  ValidationError,
  VolumeDiscount,
} from "@ns2po/types";

// Fonction d'observabilité pour les devtools
const logToConsole = (
  method: string,
  data: any,
  type: "info" | "warn" | "error" = "info"
) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    module: "useQuoteCalculator",
    method,
    data,
    type
  };

  console.group(`🔍 [NS2PO Debug] ${method}`);
  console[type]("Timestamp:", timestamp);
  console[type]("Data:", data);
  console.groupEnd();

  // Stocker dans window pour inspection
  if (typeof window !== "undefined") {
    window.__NS2PO_DEBUG__ = window.__NS2PO_DEBUG__ || [];
    window.__NS2PO_DEBUG__.push(logData);

    // Garder seulement les 50 derniers logs
    if (window.__NS2PO_DEBUG__.length > 50) {
      window.__NS2PO_DEBUG__.shift();
    }
  }
};

export const useQuoteCalculator = (
  options: Partial<QuoteCalculatorOptions> = {}
) => {
  // Configuration par défaut
  const defaultConfig: QuoteCalculatorOptions = {
    taxRate: 0.18, // TVA Côte d'Ivoire 18%
    currency: "XOF", // Franc CFA
    locale: "fr-CI",
    roundingPrecision: 0, // Pas de décimales pour le FCFA
    discountRules: {
      volumeDiscounts: [
        { minQuantity: 50, maxQuantity: 99, discountPercentage: 5 },
        { minQuantity: 100, maxQuantity: 249, discountPercentage: 10 },
        { minQuantity: 250, maxQuantity: 499, discountPercentage: 15 },
        { minQuantity: 500, discountPercentage: 20 },
      ],
      seasonalDiscounts: [],
      customerTypeDiscounts: [
        { customerType: "party", discountPercentage: 12 },
        { customerType: "organization", discountPercentage: 8 },
      ],
    },
  };

  const config = { ...defaultConfig, ...options };

  // État réactif
  const isCalculating = ref(false);
  const lastCalculation = ref<QuoteCalculation | null>(null);
  const validationErrors = ref<ValidationError[]>([]);

  /**
   * Calcule un devis complet
   */
  const calculateQuote = async (
    quoteRequest: Partial<QuoteRequest>
  ): Promise<QuoteCalculatorResult> => {
    isCalculating.value = true;
    const startTime = performance.now();

    try {
      // Validation préliminaire
      const errors = validateQuoteRequest(quoteRequest);
      if (errors.length > 0) {
        validationErrors.value = errors;
        throw new Error("Erreurs de validation dans la demande de devis");
      }

      // Calcul des items
      const calculatedItems: CalculatedItem[] = [];
      let subtotal = 0;

      for (const item of quoteRequest.items || []) {
        const calculatedItem = await calculateItem(item);
        calculatedItems.push(calculatedItem);
        subtotal += calculatedItem.totalPrice;
      }

      // Application des remises
      const discounts = calculateDiscounts(
        calculatedItems,
        quoteRequest.customer?.customerType
      );
      const discountAmount = discounts.reduce(
        (total, discount) => total + discount.amount,
        0
      );

      // Calcul des taxes
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = calculateTax(taxableAmount, config.taxRate!);

      // Total final
      const totalAmount = taxableAmount + taxAmount;

      // Génération du breakdown
      const breakdown = generatePriceBreakdown(
        calculatedItems,
        discounts,
        taxAmount,
        totalAmount
      );

      const calculation: QuoteCalculation = {
        items: calculatedItems,
        subtotal: roundAmount(subtotal),
        taxRate: config.taxRate!,
        taxAmount: roundAmount(taxAmount),
        discounts,
        discountAmount: roundAmount(discountAmount),
        totalAmount: roundAmount(totalAmount),
        breakdown,
      };

      lastCalculation.value = calculation;

      const processingTime = performance.now() - startTime;

      return {
        calculation,
        validationErrors: [],
        warnings: generateWarnings(calculation),
        metadata: {
          calculatedAt: new Date().toISOString(),
          version: "1.0",
          processingTime: Math.round(processingTime),
        },
      };
    } catch (error: unknown) {
      console.error("Erreur calcul devis:", error);
      throw error;
    } finally {
      isCalculating.value = false;
    }
  };

  /**
   * Calcule un item individuel avec ses personnalisations
   */
  const calculateItem = async (item: QuoteItem): Promise<CalculatedItem> => {
    if (!item.product) {
      throw new Error(`Produit manquant pour l'item ${item.id}`);
    }

    const basePrice = item.product.basePrice;
    let customizationsCost = 0;
    const appliedRules: AppliedRule[] = [];

    // Calcul des coûts de personnalisation
    for (const customization of item.customizations || []) {
      customizationsCost += customization.priceModifier;
    }

    // Application des règles de prix (remises quantité, urgence, etc.)
    const quantityRules = applyQuantityRules(item.quantity, basePrice);
    appliedRules.push(...quantityRules);

    const ruleModifier = appliedRules.reduce(
      (total, rule) => total + rule.modifier,
      0
    );
    const unitPrice = basePrice + customizationsCost + ruleModifier;
    const totalPrice = unitPrice * item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      basePrice: roundAmount(basePrice),
      customizationsCost: roundAmount(customizationsCost),
      appliedRules,
      unitPrice: roundAmount(unitPrice),
      totalPrice: roundAmount(totalPrice),
    };
  };

  /**
   * Applique les règles de prix basées sur la quantité
   */
  const applyQuantityRules = (
    quantity: number,
    basePrice: number
  ): AppliedRule[] => {
    const rules: AppliedRule[] = [];

    // Règle de remise progressive pour grosses quantités
    if (quantity >= 1000) {
      rules.push({
        ruleId: "bulk-1000",
        ruleName: "Remise volume 1000+",
        modifier: -basePrice * 0.25, // -25%
        reason: `Remise 25% pour commande de ${quantity} unités`,
      });
    } else if (quantity >= 500) {
      rules.push({
        ruleId: "bulk-500",
        ruleName: "Remise volume 500+",
        modifier: -basePrice * 0.2, // -20%
        reason: `Remise 20% pour commande de ${quantity} unités`,
      });
    } else if (quantity >= 100) {
      rules.push({
        ruleId: "bulk-100",
        ruleName: "Remise volume 100+",
        modifier: -basePrice * 0.15, // -15%
        reason: `Remise 15% pour commande de ${quantity} unités`,
      });
    }

    // Règle de surcoût pour petites quantités
    if (quantity < 10) {
      rules.push({
        ruleId: "small-quantity",
        ruleName: "Surcoût petite quantité",
        modifier: basePrice * 0.2, // +20%
        reason: `Surcoût 20% pour commande inférieure à 10 unités`,
      });
    }

    return rules;
  };

  /**
   * Calcule les remises applicables
   */
  const calculateDiscounts = (
    items: CalculatedItem[],
    customerType?: string
  ): AppliedDiscount[] => {
    const discounts: AppliedDiscount[] = [];
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Remises volume basées sur la quantité totale
    const volumeDiscount = findApplicableVolumeDiscount(totalQuantity);
    if (volumeDiscount) {
      discounts.push({
        id: `volume-${volumeDiscount.minQuantity}`,
        name: `Remise volume ${volumeDiscount.minQuantity}+`,
        type: "percentage",
        value: volumeDiscount.discountPercentage,
        amount: roundAmount(
          subtotal * (volumeDiscount.discountPercentage / 100)
        ),
        reason: `${volumeDiscount.discountPercentage}% de remise pour ${totalQuantity} articles`,
      });
    }

    // Remises par type de client
    if (customerType && config.discountRules?.customerTypeDiscounts) {
      const customerDiscount = config.discountRules.customerTypeDiscounts.find(
        (d) => d.customerType === customerType
      );

      if (customerDiscount) {
        discounts.push({
          id: `customer-${customerType}`,
          name: `Remise ${customerType}`,
          type: "percentage",
          value: customerDiscount.discountPercentage,
          amount: roundAmount(
            subtotal * (customerDiscount.discountPercentage / 100)
          ),
          reason: `Remise spéciale client ${customerType}`,
        });
      }
    }

    return discounts;
  };

  /**
   * Trouve la remise volume applicable
   */
  const findApplicableVolumeDiscount = (
    quantity: number
  ): VolumeDiscount | null => {
    if (!config.discountRules?.volumeDiscounts) return null;

    return (
      config.discountRules.volumeDiscounts
        .filter(
          (discount) =>
            quantity >= discount.minQuantity &&
            (!discount.maxQuantity || quantity <= discount.maxQuantity)
        )
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0] || null
    );
  };

  /**
   * Calcule les taxes
   */
  const calculateTax = (taxableAmount: number, taxRate: number): number => {
    return taxableAmount * taxRate;
  };

  /**
   * Génère le breakdown détaillé des prix
   */
  const generatePriceBreakdown = (
    items: CalculatedItem[],
    discounts: AppliedDiscount[],
    taxAmount: number,
    _totalAmount: number
  ): PriceBreakdown[] => {
    const breakdown: PriceBreakdown[] = [];

    // Items de base
    items.forEach((item) => {
      breakdown.push({
        label: `${item.quantity}x produit (base)`,
        amount: roundAmount(item.basePrice * item.quantity),
        type: "item",
        details: `Prix unitaire: ${formatCurrency(item.basePrice)}`,
      });

      if (item.customizationsCost > 0) {
        breakdown.push({
          label: `Personnalisations`,
          amount: roundAmount(item.customizationsCost * item.quantity),
          type: "customization",
          details: `Coût unitaire: ${formatCurrency(item.customizationsCost)}`,
        });
      }
    });

    // Remises
    discounts.forEach((discount) => {
      breakdown.push({
        label: discount.name,
        amount: -discount.amount,
        type: "discount",
        details: discount.reason,
      });
    });

    // Taxes
    if (taxAmount > 0) {
      breakdown.push({
        label: `TVA (${(config.taxRate! * 100).toFixed(0)}%)`,
        amount: roundAmount(taxAmount),
        type: "tax",
      });
    }

    return breakdown;
  };

  /**
   * Valide une demande de devis
   */
  const validateQuoteRequest = (
    quoteRequest: Partial<QuoteRequest>
  ): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!quoteRequest.items || quoteRequest.items.length === 0) {
      errors.push({
        field: "items",
        message: "Au moins un produit doit être sélectionné",
        code: "ITEMS_REQUIRED",
        severity: "error",
      });
    }

    quoteRequest.items?.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: "La quantité doit être supérieure à 0",
          code: "INVALID_QUANTITY",
          severity: "error",
        });
      }

      if (!item.product) {
        errors.push({
          field: `items[${index}].product`,
          message: "Informations produit manquantes",
          code: "MISSING_PRODUCT",
          severity: "error",
        });
      }
    });

    return errors;
  };

  /**
   * Génère des avertissements pour le devis
   */
  const generateWarnings = (calculation: QuoteCalculation): string[] => {
    const warnings: string[] = [];

    // Vérification montant minimum
    if (calculation.totalAmount < 10000) {
      // 10,000 FCFA minimum
      warnings.push(
        "Montant inférieur au minimum de commande recommandé (10,000 FCFA)"
      );
    }

    // Vérification quantités importantes
    const totalQuantity = calculation.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    if (totalQuantity > 5000) {
      warnings.push(
        "Commande importante nécessitant une validation des délais de production"
      );
    }

    return warnings;
  };

  /**
   * Arrondit un montant selon la précision configurée
   */
  const roundAmount = (amount: number): number => {
    const factor = Math.pow(10, config.roundingPrecision!);
    return Math.round(amount * factor) / factor;
  };

  /**
   * Formate un montant selon la locale
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      minimumFractionDigits: config.roundingPrecision,
      maximumFractionDigits: config.roundingPrecision,
    }).format(amount);
  };

  /**
   * Calcule le prix d'un produit en temps réel
   */
  const calculateProductPrice = (
    basePrice: number,
    quantity: number,
    customizations: Array<{ priceModifier?: number }> = []
  ) => {
    logToConsole("calculateProductPrice:start", {
      basePrice,
      quantity,
      customizations,
    });

    const customizationsCost = customizations.reduce(
      (sum, c) => sum + (c?.priceModifier || 0),
      0
    );
    const quantityRules = applyQuantityRules(quantity, basePrice);
    const ruleModifier = quantityRules.reduce(
      (sum, rule) => sum + rule.modifier,
      0
    );

    const unitPrice = basePrice + customizationsCost + ruleModifier;
    const totalPrice = unitPrice * quantity;

    const result = {
      unitPrice: roundAmount(unitPrice),
      totalPrice: roundAmount(totalPrice),
      customizationsCost: roundAmount(customizationsCost),
      appliedRules: quantityRules,
    };

    logToConsole("calculateProductPrice:result", result);

    return result;
  };

  return {
    // État
    isCalculating: readonly(isCalculating),
    lastCalculation: readonly(lastCalculation),
    validationErrors: readonly(validationErrors),

    // Méthodes principales
    calculateQuote,
    calculateItem,
    calculateProductPrice,

    // Méthodes utilitaires
    roundAmount,
    formatCurrency,
    validateQuoteRequest,

    // Configuration
    config: readonly(config),
  };
};
