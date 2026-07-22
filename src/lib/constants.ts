import type { ColumnsConfig } from '@/types';

export const APP_NAME = 'PolishMate';
export const APP_NAME_UPPER = 'POLISHMATE';
export const APP_LOGO_SRC = '/tutorial/POLISH LOGO.png';
export const APP_SITE_URL = 'https://polishmate.quickdart.app';

export const TERMS_OF_SERVICE_URL =
  'https://fancy-kettle-d61.notion.site/Terms-of-service-3a4b92eed9b68054bbbacadf414354c3?source=copy_link';
export const PRIVACY_POLICY_URL =
  'https://fancy-kettle-d61.notion.site/Privacy-Policy-3a4b92eed9b6800b8ff3f10590540623?source=copy_link';

export const NOTEBOOK_COLORS = [
  { id: 'red', value: '#EF4444', label: 'Red' },
  { id: 'blue', value: '#3B82F6', label: 'Blue' },
  { id: 'green', value: '#22C55E', label: 'Green' },
  { id: 'purple', value: '#A855F7', label: 'Purple' },
  { id: 'orange', value: '#F97316', label: 'Orange' },
  { id: 'cyan', value: '#06B6D4', label: 'Cyan' },
  { id: 'pink', value: '#EC4899', label: 'Pink' },
  { id: 'slate', value: '#374151', label: 'Slate' },
] as const;

export const DEFAULT_NOTEBOOK_COLOR = NOTEBOOK_COLORS[0].value;
export const DEFAULT_NOTEBOOK_NAME = 'Untitled';
export const INITIAL_NOTEBOOK_NAME = '我的笔记本';

export const DEFAULT_SHEET_TITLE = '';

export const DEFAULT_COLUMNS_CONFIG: ColumnsConfig = {
  columns: [
    {
      id: 'col_translation',
      case_type: 'translation',
      label_i18n: {
        en: 'Translation',
        'zh-CN': '翻译',
        uk: 'Переклад',
        de: 'Übersetzung',
      },
      width: 150,
      is_visible: true,
      is_system: true,
      supports_gender: false,
    },
    {
      id: 'col_nominative',
      case_type: 'nominative_singular',
      label_i18n: {
        en: 'Nominative (sg.)',
        'zh-CN': '主格（单数）',
        uk: 'Називний (одн.)',
        de: 'Nominativ (Sg.)',
      },
      width: 150,
      is_visible: true,
      is_system: true,
      supports_gender: true,
    },
  ],
  column_order: ['col_translation', 'col_nominative'],
};

export const NOTEBOOK_COLOR_STORAGE_KEY = 'polish-notebook-colors';
export const NOTEBOOK_ORDER_STORAGE_KEY = 'polish-notebook-order';

export const BRAND_RED = '#C1121F';
export const BRAND_RED_ALT = '#D32F2F';
export const VIP_GOLD = '#FFD700';
export const FREE_TIER_BG = '#F5F5F5';
export const FREE_TIER_MAX_ROWS = 30;
export const FREE_ROW_LIMIT = FREE_TIER_MAX_ROWS;

export const APP_VERSION = '1.0.0';
export const CONTACT_EMAIL = 'kathy.zhao@quickdart.app';
export const VIP_PRICE_LABEL = '14.99 USD';
export const VIP_PRICE_DESCRIPTION = '永久会员';
