const EFO_VAREGRUPPER: Record<string, string> = {
  '165951': 'Antennemateriell',
  '165935': 'Armaturer for natrium-, metalldamplamper og LED-lamper',
  '165948': 'Brytere',
  '165940': 'Elektriske husholdningsapparater',
  '165945': 'Elektriske kokeapparater',
  '165956': 'Elektroniske styresystemer (PLS) etc',
  '165958': 'Elektrovarme og termostater',
  '165946': 'Elektrovarme og termostater',
  '165919': 'Festemateriell, kabelstiger og kabelrenner',
  '165950': 'Glødelampe og LED-armaturer, innendørs, tilbehør',
  '165924': 'Glødelampe og LED-armaturer, utendørs',
  '165936': 'Glødelamper, halogenlamper, LED-lamper',
  '165947': 'Instrumenter',
  '165954': 'Isolasjons- og loddemateriell, merkingsutstyr, krympeslange',
  '165934': 'Kabelmuffer og kabelfordelingsskap',
  '165922': 'Kabler og ledninger',
  '165933': 'Koblingsmateriell for tele/data',
  '165928': 'Kommunikasjonsapparater',
  '165923': 'Kondensatorer',
  '165957': 'Linjemateriell',
  '165943': 'Lyd og bilde',
  '165916': 'Lyskastere og effektbelysning',
  '165921': 'Lysrør og damplamper',
  '165955': 'Lysrørarmatur og tilbehør',
  '165937': 'Motorer',
  '165952': 'Målere og måleromkoblere',
  '165941': 'Plateskap med tilbehør i stål og aluminium',
  '165930': 'Rør, tak- og veggbokser, koblingsmateriell, kanalsystemer',
  '165949': 'Signaldistribusjonsanlegg',
  '165918': 'Signalutstyr og alarmsystemer',
  '165938': 'Sikringsbokser og -skap/sikringsstativer',
  '165931': 'Sikringsmateriell',
  '165926': 'Skap med tilbehør i silumin og isolerstoff',
  '165920': 'Verktøy',
  '165917': 'Vifter, varmevifter og pumper',
};

export const resolveEfoVaregruppeName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const codeMatch = trimmed.match(/\b\d{4,6}\b/);
  const code = codeMatch?.[0] || trimmed;
  if (EFO_VAREGRUPPER[code]) return EFO_VAREGRUPPER[code];
  return trimmed;
};

export const isVaregruppeCode = (value: string) => /^\d{4,6}$/.test(value.trim());
