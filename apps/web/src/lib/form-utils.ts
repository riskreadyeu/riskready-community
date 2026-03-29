/**
 * Form Utilities - Standardized react-hook-form + zod pattern
 *
 * STANDARD FORM PATTERN:
 *
 * 1. Define a Zod schema for your form fields:
 *    const formSchema = z.object({
 *      title: z.string().min(1, 'Title is required'),
 *      description: z.string().optional(),
 *      status: z.enum(['DRAFT', 'ACTIVE']),
 *    });
 *
 * 2. Use the useZodForm hook in your component:
 *    const form = useZodForm(formSchema, { title: '', status: 'DRAFT' });
 *
 * 3. For text/number/date inputs, use register():
 *    <Input {...form.register('title')} />
 *    {form.formState.errors.title && (
 *      <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
 *    )}
 *
 * 4. For Radix Select components (which don't support ref forwarding),
 *    use watch() + setValue():
 *    <Select
 *      value={form.watch('status')}
 *      onValueChange={(v) => form.setValue('status', v, { shouldValidate: true })}
 *    >
 *
 * 5. For switches/checkboxes, use watch() + setValue():
 *    <Switch
 *      checked={form.watch('enabled')}
 *      onCheckedChange={(v) => form.setValue('enabled', v, { shouldValidate: true })}
 *    />
 *
 * 6. Wrap your submit handler with form.handleSubmit():
 *    const onSubmit = form.handleSubmit(async (data) => {
 *      await api.create(data);
 *    });
 *    <form onSubmit={onSubmit}>
 *
 * 7. To reset on dialog close:
 *    form.reset();
 *
 * 8. To pre-populate for editing, pass values via reset():
 *    useEffect(() => { if (entity) form.reset(mapToFormValues(entity)); }, [entity]);
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm, type UseFormReturn, type DefaultValues } from 'react-hook-form';

/**
 * A thin wrapper around useForm that wires up zodResolver automatically.
 * Returns the standard UseFormReturn so all react-hook-form APIs are available.
 */
export function useZodForm<T extends z.ZodType>(
  schema: T,
  defaultValues?: DefaultValues<z.infer<T>>,
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}

export { z } from 'zod';
