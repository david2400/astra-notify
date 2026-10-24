import {useTranslations} from 'next-intl';
import {z} from 'zod';

export const validation = () => {
  const intl = useTranslations('Form');

  const validationSchema = z.object({
    username: z.string().min(15, {message: intl('requiredField')}),
    password: z.string().min(4, {message: intl('requiredField')}),
  });

  return validationSchema;
};
