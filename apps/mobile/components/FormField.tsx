import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password' | 'name' | 'new-password' | 'current-password';
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View className="space-y-1">
          <Text className="text-sm font-medium text-slate-700">{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900"
            placeholderTextColor="#94a3b8"
            {...inputProps}
          />
          {error && <Text className="text-sm text-red-600">{error.message}</Text>}
        </View>
      )}
    />
  );
}
