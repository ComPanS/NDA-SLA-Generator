import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { icuLocaleFor } from '@/shared/i18n/icuLocale';
import { outputLanguageSelectOptions } from '@/shared/i18n/outputLanguagePresets';
import { countryOptionsForLocale } from '@/shared/utils/isoCountries';

export type ContractJurisdictionFormFieldsProps = {
  countryCode: string;
  outputLanguage: string;
  onCountryChange: (code: string) => void;
  onOutputLanguageChange: (lang: string) => void;
  disabled?: boolean;
  /** When false, only the country autocomplete is shown (e.g. template defaults). */
  showOutputLanguage?: boolean;
  outputLanguageError?: boolean;
};

export function ContractJurisdictionFormFields({
  countryCode,
  outputLanguage,
  onCountryChange,
  onOutputLanguageChange,
  disabled,
  showOutputLanguage = true,
  outputLanguageError = false,
}: ContractJurisdictionFormFieldsProps) {
  const { t } = useTranslation('contracts');
  const { i18n } = useTranslation();
  const displayLocale = icuLocaleFor(i18n.language);
  const options = useMemo(() => countryOptionsForLocale(displayLocale), [displayLocale]);
  const value = useMemo(
    () => options.find((o) => o.code === countryCode) ?? null,
    [options, countryCode],
  );

  const languageMenuOptions = useMemo(
    () => outputLanguageSelectOptions(outputLanguage, displayLocale),
    [outputLanguage, displayLocale],
  );

  return (
    <>
      <Autocomplete
        disabled={disabled}
        options={options}
        getOptionLabel={(o) => `${o.label} (${o.code})`}
        value={value}
        onChange={(_, v) => onCountryChange(v?.code ?? 'RU')}
        isOptionEqualToValue={(a, b) => a.code === b.code}
        sx={{
          '& .MuiOutlinedInput-root': { cursor: 'pointer' },
          '& .MuiAutocomplete-inputRoot': { cursor: 'pointer' },
        }}
        slotProps={{
          popper: { disablePortal: true },
        }}
        ListboxProps={{
          style: { maxHeight: 280 },
          sx: { '& .MuiAutocomplete-option': { cursor: 'pointer' } },
        }}
        renderInput={(params) => (
          <TextField {...params} label={t('new.countryLabel')} margin="normal" />
        )}
      />
      {showOutputLanguage ? (
        <FormControl
          fullWidth
          margin="normal"
          error={outputLanguageError}
          disabled={disabled}
          sx={{ cursor: disabled ? 'default' : 'pointer' }}
        >
          <InputLabel id="contract-output-language-label">
            {t('new.outputLanguageLabel')}
          </InputLabel>
          <Select
            labelId="contract-output-language-label"
            value={outputLanguage}
            label={t('new.outputLanguageLabel')}
            onChange={(e) => onOutputLanguageChange(e.target.value)}
            sx={{ cursor: disabled ? 'default' : 'pointer' }}
            MenuProps={{
              // Avoid document.body portal: same removeChild race as Autocomplete when
              // the menu unmounts with the route or parent (refine panel, Strict Mode).
              disablePortal: true,
              PaperProps: {
                sx: { maxHeight: 320 },
              },
              MenuListProps: {
                sx: { '& .MuiMenuItem-root': { cursor: 'pointer' } },
              },
            }}
          >
            {languageMenuOptions.map(({ tag, label }) => (
              <MenuItem key={tag} value={tag}>
                {label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {outputLanguageError ? t('new.outputLanguageError') : t('new.outputLanguageHelper')}
          </FormHelperText>
        </FormControl>
      ) : null}
    </>
  );
}
