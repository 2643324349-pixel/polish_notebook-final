import type {
  AdjectiveEntryStructure,
  CaseInfoStructure,
  CaseKey,
  InvariableCategoryStructure,
  NounEntryStructure,
  NumeralEntryStructure,
  PronounEntryStructure,
  VerbEntryStructure,
} from '@/types/guide';

export const CASE_STRUCTURE: Record<CaseKey, CaseInfoStructure> = {
  nom: {
    key: 'nom',
    abbr: 'NOM',
    namePl: 'Nominativus',
    example: 'Dom jest duży.',
  },
  gen: {
    key: 'gen',
    abbr: 'GEN',
    namePl: 'Genetivus',
    example: 'Nie ma mleka.',
  },
  dat: {
    key: 'dat',
    abbr: 'DAT',
    namePl: 'Dativus',
    example: 'Daję mamie kwiaty.',
  },
  acc: {
    key: 'acc',
    abbr: 'ACC',
    namePl: 'Accusativus',
    example: 'Widzę kota.',
  },
  ins: {
    key: 'ins',
    abbr: 'INS',
    namePl: 'Instrumentalis',
    example: 'Piszę długopisem.',
  },
  loc: {
    key: 'loc',
    abbr: 'LOC',
    namePl: 'Locativus',
    example: 'Mieszkam w Warszawie.',
  },
  voc: {
    key: 'voc',
    abbr: 'VOC',
    namePl: 'Vocativus',
    example: 'Anno, chodź tutaj!',
  },
};

export const NOUN_STRUCTURES: NounEntryStructure[] = [
  {
    id: 'kobieta',
    lemma: 'kobieta',
    singular: {
      nom: 'kobieta',
      gen: 'kobiety',
      dat: 'kobiecie',
      acc: 'kobietę',
      ins: 'kobietą',
      loc: 'kobiecie',
      voc: 'kobieto',
    },
    plural: {
      nom: 'kobiety',
      gen: 'kobiet',
      dat: 'kobietom',
      acc: 'kobiety',
      ins: 'kobietami',
      loc: 'kobietach',
      voc: 'kobiety',
    },
  },
  {
    id: 'dom',
    lemma: 'dom',
    singular: {
      nom: 'dom',
      gen: 'domu',
      dat: 'domowi',
      acc: 'dom',
      ins: 'domem',
      loc: 'domu',
      voc: 'domu',
    },
    plural: {
      nom: 'domy',
      gen: 'domów',
      dat: 'domom',
      acc: 'domy',
      ins: 'domami',
      loc: 'domach',
      voc: 'domy',
    },
  },
  {
    id: 'dziecko',
    lemma: 'dziecko',
    singular: {
      nom: 'dziecko',
      gen: 'dziecka',
      dat: 'dziecku',
      acc: 'dziecko',
      ins: 'dzieckiem',
      loc: 'dziecku',
      voc: 'dziecko',
    },
    plural: {
      nom: 'dzieci',
      gen: 'dzieci',
      dat: 'dzieciom',
      acc: 'dzieci',
      ins: 'dziećmi',
      loc: 'dzieciach',
      voc: 'dzieci',
    },
  },
];

function adjSg(
  m: string,
  f: string,
  n: string,
): { m: string; f: string; n: string } {
  return { m, f, n };
}

export const ADJECTIVE_STRUCTURES: AdjectiveEntryStructure[] = [
  {
    id: 'dobry',
    lemma: 'dobry',
    singular: {
      nom: adjSg('dobry', 'dobra', 'dobre'),
      gen: adjSg('dobrego', 'dobrej', 'dobrego'),
      dat: adjSg('dobremu', 'dobrej', 'dobremu'),
      acc: adjSg('dobrego', 'dobrą', 'dobre'),
      ins: adjSg('dobrym', 'dobrą', 'dobrym'),
      loc: adjSg('dobrym', 'dobrej', 'dobrym'),
      voc: adjSg('dobry', 'dobra', 'dobre'),
    },
    plural: {
      nom: adjSg('dobrzy', 'dobre', 'dobre'),
      gen: adjSg('dobrych', 'dobrych', 'dobrych'),
      dat: adjSg('dobrym', 'dobrym', 'dobrym'),
      acc: adjSg('dobrych', 'dobre', 'dobre'),
      ins: adjSg('dobrymi', 'dobrymi', 'dobrymi'),
      loc: adjSg('dobrych', 'dobrych', 'dobrych'),
      voc: adjSg('dobrzy', 'dobre', 'dobre'),
    },
  },
  {
    id: 'duzy',
    lemma: 'duży',
    singular: {
      nom: adjSg('duży', 'duża', 'duże'),
      gen: adjSg('dużego', 'dużej', 'dużego'),
      dat: adjSg('dużemu', 'dużej', 'dużemu'),
      acc: adjSg('dużego', 'dużą', 'duże'),
      ins: adjSg('dużym', 'dużą', 'dużym'),
      loc: adjSg('dużym', 'dużej', 'dużym'),
      voc: adjSg('duży', 'duża', 'duże'),
    },
    plural: {
      nom: adjSg('duży', 'duże', 'duże'),
      gen: adjSg('dużych', 'dużych', 'dużych'),
      dat: adjSg('dużym', 'dużym', 'dużym'),
      acc: adjSg('dużych', 'duże', 'duże'),
      ins: adjSg('dużymi', 'dużymi', 'dużymi'),
      loc: adjSg('dużych', 'dużych', 'dużych'),
      voc: adjSg('duży', 'duże', 'duże'),
    },
  },
  {
    id: 'nowy',
    lemma: 'nowy',
    singular: {
      nom: adjSg('nowy', 'nowa', 'nowe'),
      gen: adjSg('nowego', 'nowej', 'nowego'),
      dat: adjSg('nowemu', 'nowej', 'nowemu'),
      acc: adjSg('nowego', 'nową', 'nowe'),
      ins: adjSg('nowym', 'nową', 'nowym'),
      loc: adjSg('nowym', 'nowej', 'nowym'),
      voc: adjSg('nowy', 'nowa', 'nowe'),
    },
    plural: {
      nom: adjSg('nowi', 'nowe', 'nowe'),
      gen: adjSg('nowych', 'nowych', 'nowych'),
      dat: adjSg('nowym', 'nowym', 'nowym'),
      acc: adjSg('nowych', 'nowe', 'nowe'),
      ins: adjSg('nowymi', 'nowymi', 'nowymi'),
      loc: adjSg('nowych', 'nowych', 'nowych'),
      voc: adjSg('nowi', 'nowe', 'nowe'),
    },
  },
];

export const DEMONSTRATIVE_PRONOUN_STRUCTURES: PronounEntryStructure[] = [
  {
    id: 'ten',
    lemma: 'ten',
    singular: {
      nom: adjSg('ten', 'ta', 'to'),
      gen: adjSg('tego', 'tej', 'tego'),
      dat: adjSg('temu', 'tej', 'temu'),
      acc: adjSg('tego', 'tę', 'to'),
      ins: adjSg('tym', 'tą', 'tym'),
      loc: adjSg('tym', 'tej', 'tym'),
      voc: adjSg('ten', 'ta', 'to'),
    },
    plural: {
      nom: adjSg('ci', 'te', 'te'),
      gen: adjSg('tych', 'tych', 'tych'),
      dat: adjSg('tym', 'tym', 'tym'),
      acc: adjSg('tych', 'te', 'te'),
      ins: adjSg('tymi', 'tymi', 'tymi'),
      loc: adjSg('tych', 'tych', 'tych'),
      voc: adjSg('ci', 'te', 'te'),
    },
  },
  {
    id: 'tamten',
    lemma: 'tamten',
    singular: {
      nom: adjSg('tamten', 'tamta', 'tamto'),
      gen: adjSg('tamtego', 'tamtej', 'tamtego'),
      dat: adjSg('tamtemu', 'tamtej', 'tamtemu'),
      acc: adjSg('tamtego', 'tamtę', 'tamto'),
      ins: adjSg('tamtym', 'tamtą', 'tamtym'),
      loc: adjSg('tamtym', 'tamtej', 'tamtym'),
      voc: adjSg('tamten', 'tamta', 'tamto'),
    },
    plural: {
      nom: adjSg('tamci', 'tamte', 'tamte'),
      gen: adjSg('tamtych', 'tamtych', 'tamtych'),
      dat: adjSg('tamtym', 'tamtym', 'tamtym'),
      acc: adjSg('tamtych', 'tamte', 'tamte'),
      ins: adjSg('tamtymi', 'tamtymi', 'tamtymi'),
      loc: adjSg('tamtych', 'tamtych', 'tamtych'),
      voc: adjSg('tamci', 'tamte', 'tamte'),
    },
  },
];

export const PERSONAL_PRONOUN_STRUCTURES: PronounEntryStructure[] = [
  {
    id: 'ja',
    lemma: 'ja',
    singular: {
      nom: adjSg('ja', 'ja', 'ja'),
      gen: adjSg('mnie', 'mnie', 'mnie'),
      dat: adjSg('mnie', 'mnie', 'mnie'),
      acc: adjSg('mnie', 'mnie', 'mnie'),
      ins: adjSg('mną', 'mną', 'mną'),
      loc: adjSg('mnie', 'mnie', 'mnie'),
      voc: adjSg('—', '—', '—'),
    },
    plural: {
      nom: adjSg('my', 'my', 'my'),
      gen: adjSg('nas', 'nas', 'nas'),
      dat: adjSg('nam', 'nam', 'nam'),
      acc: adjSg('nas', 'nas', 'nas'),
      ins: adjSg('nami', 'nami', 'nami'),
      loc: adjSg('nas', 'nas', 'nas'),
      voc: adjSg('—', '—', '—'),
    },
  },
  {
    id: 'ty',
    lemma: 'ty',
    singular: {
      nom: adjSg('ty', 'ty', 'ty'),
      gen: adjSg('ciebie', 'ciebie', 'ciebie'),
      dat: adjSg('tobie', 'tobie', 'tobie'),
      acc: adjSg('ciebie', 'ciebie', 'ciebie'),
      ins: adjSg('tobą', 'tobą', 'tobą'),
      loc: adjSg('tobie', 'tobie', 'tobie'),
      voc: adjSg('ty', 'ty', 'ty'),
    },
    plural: {
      nom: adjSg('wy', 'wy', 'wy'),
      gen: adjSg('was', 'was', 'was'),
      dat: adjSg('wam', 'wam', 'wam'),
      acc: adjSg('was', 'was', 'was'),
      ins: adjSg('wami', 'wami', 'wami'),
      loc: adjSg('was', 'was', 'was'),
      voc: adjSg('—', '—', '—'),
    },
  },
];

export const NUMERAL_234_STRUCTURES: NumeralEntryStructure[] = [
  {
    id: 'dwa',
    lemma: 'dwa',
    hasGender: true,
    singular: {
      nom: adjSg('dwa', 'dwie', 'dwa'),
      gen: adjSg('dwóch', 'dwóch', 'dwóch'),
      dat: adjSg('dwóm', 'dwóm', 'dwóm'),
      acc: adjSg('dwa/dwóch', 'dwie', 'dwa'),
      ins: adjSg('dwoma', 'dwiema', 'dwoma'),
      loc: adjSg('dwóch', 'dwóch', 'dwóch'),
      voc: adjSg('dwa', 'dwie', 'dwa'),
    },
    plural: {
      nom: adjSg('dwa', 'dwie', 'dwa'),
      gen: adjSg('dwóch', 'dwóch', 'dwóch'),
      dat: adjSg('dwóm', 'dwóm', 'dwóm'),
      acc: adjSg('dwa/dwóch', 'dwie', 'dwa'),
      ins: adjSg('dwoma', 'dwiema', 'dwoma'),
      loc: adjSg('dwóch', 'dwóch', 'dwóch'),
      voc: adjSg('dwa', 'dwie', 'dwa'),
    },
  },
  {
    id: 'trzy',
    lemma: 'trzy',
    hasGender: true,
    singular: {
      nom: adjSg('trzej', 'trzy', 'trzy'),
      gen: adjSg('trzech', 'trzech', 'trzech'),
      dat: adjSg('trzem', 'trzem', 'trzem'),
      acc: adjSg('trzech', 'trzy', 'trzy'),
      ins: adjSg('trzema', 'trzema', 'trzema'),
      loc: adjSg('trzech', 'trzech', 'trzech'),
      voc: adjSg('trzej', 'trzy', 'trzy'),
    },
    plural: {
      nom: adjSg('trzej', 'trzy', 'trzy'),
      gen: adjSg('trzech', 'trzech', 'trzech'),
      dat: adjSg('trzem', 'trzem', 'trzem'),
      acc: adjSg('trzech', 'trzy', 'trzy'),
      ins: adjSg('trzema', 'trzema', 'trzema'),
      loc: adjSg('trzech', 'trzech', 'trzech'),
      voc: adjSg('trzej', 'trzy', 'trzy'),
    },
  },
  {
    id: 'cztery',
    lemma: 'cztery',
    hasGender: true,
    singular: {
      nom: adjSg('czterej', 'cztery', 'cztery'),
      gen: adjSg('czterech', 'czterech', 'czterech'),
      dat: adjSg('czterem', 'czterem', 'czterem'),
      acc: adjSg('czterech', 'cztery', 'cztery'),
      ins: adjSg('czterema', 'czterema', 'czterema'),
      loc: adjSg('czterech', 'czterech', 'czterech'),
      voc: adjSg('czterej', 'cztery', 'cztery'),
    },
    plural: {
      nom: adjSg('czterej', 'cztery', 'cztery'),
      gen: adjSg('czterech', 'czterech', 'czterech'),
      dat: adjSg('czterem', 'czterem', 'czterem'),
      acc: adjSg('czterech', 'cztery', 'cztery'),
      ins: adjSg('czterema', 'czterema', 'czterema'),
      loc: adjSg('czterech', 'czterech', 'czterech'),
      voc: adjSg('czterej', 'cztery', 'cztery'),
    },
  },
];

export const NUMERAL_5PLUS_STRUCTURES: NumeralEntryStructure[] = [
  {
    id: 'piec',
    lemma: 'pięć',
    hasGender: false,
    forms: {
      nom: 'pięć',
      gen: 'pięciu',
      dat: 'pięciu',
      acc: 'pięć',
      ins: 'pięcioma',
      loc: 'pięciu',
      voc: 'pięć',
    },
  },
];

export const ORDINAL_NUMERAL_STRUCTURES: NumeralEntryStructure[] = [
  {
    id: 'pierwszy',
    lemma: 'pierwszy',
    hasGender: true,
    singular: {
      nom: adjSg('pierwszy', 'pierwsza', 'pierwsze'),
      gen: adjSg('pierwszego', 'pierwszej', 'pierwszego'),
      dat: adjSg('pierwszemu', 'pierwszej', 'pierwszemu'),
      acc: adjSg('pierwszego', 'pierwszą', 'pierwsze'),
      ins: adjSg('pierwszym', 'pierwszą', 'pierwszym'),
      loc: adjSg('pierwszym', 'pierwszej', 'pierwszym'),
      voc: adjSg('pierwszy', 'pierwsza', 'pierwsze'),
    },
    plural: {
      nom: adjSg('pierwsi', 'pierwsze', 'pierwsze'),
      gen: adjSg('pierwszych', 'pierwszych', 'pierwszych'),
      dat: adjSg('pierwszym', 'pierwszym', 'pierwszym'),
      acc: adjSg('pierwszych', 'pierwsze', 'pierwsze'),
      ins: adjSg('pierwszymi', 'pierwszymi', 'pierwszymi'),
      loc: adjSg('pierwszych', 'pierwszych', 'pierwszych'),
      voc: adjSg('pierwsi', 'pierwsze', 'pierwsze'),
    },
  },
  {
    id: 'drugi',
    lemma: 'drugi',
    hasGender: true,
    singular: {
      nom: adjSg('drugi', 'druga', 'drugie'),
      gen: adjSg('drugiego', 'drugiej', 'drugiego'),
      dat: adjSg('drugiemu', 'drugiej', 'drugiemu'),
      acc: adjSg('drugiego', 'drugą', 'drugie'),
      ins: adjSg('drugim', 'drugą', 'drugim'),
      loc: adjSg('drugim', 'drugiej', 'drugim'),
      voc: adjSg('drugi', 'druga', 'drugie'),
    },
    plural: {
      nom: adjSg('drudzy', 'drugie', 'drugie'),
      gen: adjSg('drugich', 'drugich', 'drugich'),
      dat: adjSg('drugim', 'drugim', 'drugim'),
      acc: adjSg('drugich', 'drugie', 'drugie'),
      ins: adjSg('drugimi', 'drugimi', 'drugimi'),
      loc: adjSg('drugich', 'drugich', 'drugich'),
      voc: adjSg('drudzy', 'drugie', 'drugie'),
    },
  },
];

export const VERB_ROBIC_STRUCTURE: VerbEntryStructure = {
  id: 'robic',
  lemma: 'robić',
  rows: [
    {
      personId: '1sg',
      present: 'robię',
      past: { m: 'robiłem', f: 'robiłam' },
    },
    {
      personId: '2sg',
      present: 'robisz',
      past: { m: 'robiłeś', f: 'robiłaś' },
    },
    {
      personId: '3sg',
      present: 'robi',
      past: { m: 'robił', f: 'robiła', n: 'robiło' },
    },
    {
      personId: '1pl',
      present: 'robimy',
      past: { m: 'robiliśmy', f: 'robiłyśmy' },
    },
    {
      personId: '2pl',
      present: 'robicie',
      past: { m: 'robiliście', f: 'robiłyście' },
    },
    {
      personId: '3pl',
      present: 'robią',
      past: { m: 'robili', f: 'robiły' },
    },
  ],
};

export const ADVERB_CATEGORY_STRUCTURES: InvariableCategoryStructure[] = [
  {
    group: 'adverb',
    categoryId: 'time',
    items: [
      { id: 'dzis', polish: 'dziś' },
      { id: 'jutro', polish: 'jutro' },
      { id: 'wczoraj', polish: 'wczoraj' },
      { id: 'teraz', polish: 'teraz' },
      { id: 'juz', polish: 'już' },
      { id: 'jeszcze', polish: 'jeszcze' },
      { id: 'zawsze', polish: 'zawsze' },
      { id: 'nigdy', polish: 'nigdy' },
      { id: 'czesto', polish: 'często' },
      { id: 'wkrotce', polish: 'wkrótce' },
    ],
  },
  {
    group: 'adverb',
    categoryId: 'place',
    items: [
      { id: 'tu_tutaj', polish: 'tu/tutaj' },
      { id: 'tam', polish: 'tam' },
      { id: 'wszedzie', polish: 'wszędzie' },
      { id: 'nigdzie', polish: 'nigdzie' },
      { id: 'blisko', polish: 'blisko' },
      { id: 'daleko', polish: 'daleko' },
      { id: 'wewnatrz', polish: 'wewnątrz' },
      { id: 'na_zewnatrz', polish: 'na zewnątrz' },
      { id: 'w_gore', polish: 'w górę' },
      { id: 'w_dol', polish: 'w dół' },
    ],
  },
  {
    group: 'adverb',
    categoryId: 'degree',
    items: [
      { id: 'bardzo', polish: 'bardzo' },
      { id: 'troche', polish: 'trochę' },
      { id: 'calkiem', polish: 'całkiem' },
      { id: 'dosc', polish: 'dość' },
      { id: 'za', polish: 'za' },
      { id: 'mniej', polish: 'mniej' },
      { id: 'wiecej', polish: 'więcej' },
      { id: 'najbardziej', polish: 'najbardziej' },
      { id: 'prawie', polish: 'prawie' },
      { id: 'zupelnie', polish: 'zupełnie' },
    ],
  },
  {
    group: 'adverb',
    categoryId: 'manner',
    items: [
      { id: 'tak', polish: 'tak' },
      { id: 'inaczej', polish: 'inaczej' },
      { id: 'razem', polish: 'razem' },
      { id: 'szybko', polish: 'szybko' },
      { id: 'wolno', polish: 'wolno' },
      { id: 'dobrze', polish: 'dobrze' },
      { id: 'zle', polish: 'źle' },
      { id: 'prosto', polish: 'prosto' },
      { id: 'osobno', polish: 'osobno' },
      { id: 'naprawde', polish: 'naprawdę' },
    ],
  },
];

export const PREPOSITION_CATEGORY_STRUCTURES: InvariableCategoryStructure[] = [
  {
    group: 'preposition',
    categoryId: 'common',
    items: [
      { id: 'w', polish: 'w' },
      { id: 'na', polish: 'na' },
      { id: 'do', polish: 'do' },
      { id: 'z', polish: 'z' },
      { id: 'od', polish: 'od' },
      { id: 'po', polish: 'po' },
      { id: 'przed', polish: 'przed' },
      { id: 'za', polish: 'za' },
      { id: 'o', polish: 'o' },
      { id: 'dla', polish: 'dla' },
    ],
  },
];

export const CONJUNCTION_CATEGORY_STRUCTURES: InvariableCategoryStructure[] = [
  {
    group: 'conjunction',
    categoryId: 'common',
    items: [
      { id: 'i', polish: 'i' },
      { id: 'ale', polish: 'ale' },
      { id: 'lub', polish: 'lub' },
      { id: 'bo', polish: 'bo' },
      { id: 'ze', polish: 'że' },
      { id: 'wiec', polish: 'więc' },
      { id: 'jednak', polish: 'jednak' },
      { id: 'albo', polish: 'albo' },
      { id: 'czy', polish: 'czy' },
      { id: 'poniewaz', polish: 'ponieważ' },
    ],
  },
];

export const POS_DESCRIPTION_IDS: Partial<
  Record<
    | 'noun'
    | 'adverb'
    | 'adjective'
    | 'pronoun'
    | 'numeral'
    | 'verb'
    | 'preposition'
    | 'conjunction',
    true
  >
> = {
  noun: true,
  adjective: true,
  pronoun: true,
  numeral: true,
  verb: true,
  adverb: true,
  preposition: true,
  conjunction: true,
};
