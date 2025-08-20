function calculerMontants(prixUnitaireHT, nbJours, remise = 0, tauxTVA = 0.19) {
  const montantTotalHT = prixUnitaireHT * nbJours;
  const montantTVA = montantTotalHT * tauxTVA;
  const montantTotalTTC = montantTotalHT + montantTVA - remise;

  return {
    montantTotalHT,
    montantTVA,
    tauxTVA,
    montantTotalTTC
  };
}

module.exports = { calculerMontants };
