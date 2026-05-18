function number(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pct(value) {
  return Number(value.toFixed(2));
}

export function buildSpreadUnderwriting({ rfq = {}, option = {}, prefabEstimate = {}, body = {} } = {}) {
  const request = rfq.metadata_json?.activation_request || rfq.qualification_json?.activation_request || {};
  const economics = {
    ...(rfq.metadata_json?.activation_economics || {}),
    ...(rfq.qualification_json?.activation_economics || {}),
    ...(body.economics || {}),
  };
  const tenantRent = number(body.tenant_monthly_rent, 0)
    || number(economics.tenant_monthly_rent, 0)
    || number(request.monthly_budget, 0);
  const landRent = number(body.land_rent, 0)
    || number(economics.land_rent, 0)
    || number(option.price_amount, 0);
  const modularLease = number(body.modular_unit_lease, 0)
    || number(economics.modular_unit_lease, 0)
    || number(prefabEstimate.monthly_lease_range?.base, 0);
  const installRemovalAmortization = number(body.install_removal_amortization, 0)
    || number(economics.install_removal_amortization, 0)
    || Math.round(number(prefabEstimate.install_removal_estimate, 0) / 24);
  const maintenanceReserve = number(body.maintenance_reserve, 0)
    || number(economics.maintenance_reserve, 0)
    || Math.round(tenantRent * 0.06);
  const targetCoverage = number(body.target_coverage, 0) || number(economics.target_coverage, 1.5) || 1.5;
  const fixedMonthlyObligations = landRent + modularLease + installRemovalAmortization + maintenanceReserve;
  const monthlySpread = tenantRent - fixedMonthlyObligations;
  const fixedCostCoverage = fixedMonthlyObligations > 0 ? tenantRent / fixedMonthlyObligations : 0;
  const permitDelayMonths = number(body.permit_delay_months, 2);
  const vacancyMonths = number(body.vacancy_months, 1);
  const downsideCashBufferNeeded = Math.round(fixedMonthlyObligations * (permitDelayMonths + vacancyMonths));

  return {
    underwriting_engine_version: "activation_spread_v1",
    status: fixedMonthlyObligations > 0 && tenantRent > 0 ? "ready" : "needs_assumptions",
    inputs: {
      tenant_monthly_rent: tenantRent || null,
      land_rent: landRent || null,
      modular_unit_lease: modularLease || null,
      install_removal_amortization: installRemovalAmortization || null,
      maintenance_reserve: maintenanceReserve || null,
      target_coverage: targetCoverage,
      permit_delay_months: permitDelayMonths,
      vacancy_months: vacancyMonths,
    },
    summary: {
      recommendation: fixedCostCoverage >= targetCoverage ? "pursue" : "needs_price_or_rent_reset",
      mandate_fit_score: Math.round(Math.min(100, fixedCostCoverage * 45)),
      median_irr: pct(monthlySpread / Math.max(1, fixedMonthlyObligations) * 12),
      p10_irr: pct((monthlySpread - fixedMonthlyObligations * 0.18) / Math.max(1, fixedMonthlyObligations) * 12),
      p90_irr: pct((monthlySpread + tenantRent * 0.12) / Math.max(1, fixedMonthlyObligations) * 12),
      target_irr: targetCoverage,
      capex_overrun_risk: prefabEstimate.confidence_score >= 0.7 ? "moderate" : "high",
      current_ask: landRent,
      max_bid: Math.max(0, Math.round(tenantRent / targetCoverage - modularLease - installRemovalAmortization - maintenanceReserve)),
      main_risk: fixedCostCoverage >= targetCoverage ? "rights_and_permits" : "weak_fixed_cost_coverage",
      next_action: fixedCostCoverage >= targetCoverage ? "approval_gated_outreach" : "renegotiate_land_or_supplier_terms",
      expected_monthly_spread: monthlySpread,
      fixed_monthly_obligations: fixedMonthlyObligations,
      fixed_cost_coverage: pct(fixedCostCoverage),
      target_coverage: targetCoverage,
      operator_route_allowed: fixedCostCoverage >= targetCoverage,
      downside_cash_buffer_needed: downsideCashBufferNeeded,
      missing_assumptions: fixedMonthlyObligations > 0 && tenantRent > 0 ? [] : ["tenant rent", "land rent", "modular lease"],
      planning_note: "Planning model only; operator route still requires legal rights, permit path, and reserves.",
    },
    scenarios: [
      {
        key: "downside",
        label: "Downside",
        assumptions: { tenant_rent: tenantRent * 0.88, fixed_obligations: fixedMonthlyObligations * 1.08 },
        metrics: { annual_cash_flow: (monthlySpread - Math.round(fixedMonthlyObligations * 0.18)) * 12, cash_on_cash: pct((tenantRent * 0.88) / Math.max(1, fixedMonthlyObligations * 1.08)) },
      },
      {
        key: "base",
        label: "Base",
        assumptions: { tenant_rent: tenantRent, fixed_obligations: fixedMonthlyObligations },
        metrics: { annual_cash_flow: monthlySpread * 12, cash_on_cash: pct(fixedCostCoverage) },
      },
      {
        key: "upside",
        label: "Upside",
        assumptions: { tenant_rent: tenantRent * 1.08, fixed_obligations: fixedMonthlyObligations * 0.96 },
        metrics: { annual_cash_flow: (monthlySpread + Math.round(tenantRent * 0.12)) * 12, cash_on_cash: pct((tenantRent * 1.08) / Math.max(1, fixedMonthlyObligations * 0.96)) },
      },
    ],
    capex: {
      low: prefabEstimate.low_total ?? null,
      base: prefabEstimate.base_total ?? null,
      high: prefabEstimate.high_total ?? null,
      source: "prefab_estimator",
      pricing_status: prefabEstimate.pricing_status || null,
      confidence_score: prefabEstimate.confidence_score || null,
    },
    hard_stops: fixedCostCoverage >= targetCoverage ? [] : ["weak_fixed_cost_coverage"],
    generated_at: new Date().toISOString(),
  };
}
