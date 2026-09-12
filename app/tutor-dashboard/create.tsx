import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextInput } from '@/components/TextInput';
import { useTranslation } from '@/i18n';
import { createCourse } from '@/services/api/courses';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { CourseType } from '@/types/models';

export default function CreateCourseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('25');
  const [type, setType] = useState<CourseType>('Skills');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await createCourse({
        title,
        description,
        type,
        categoryId,
        priceDecimal: Number(price),
        sessionCount: 1,
        capacity: 10,
        format: 'Online',
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.createTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label={t('tutorDashboard.courseTitle')}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          label={t('tutorDashboard.description')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          label={t('tutorDashboard.price')}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          label="Category ID"
          value={categoryId}
          onChangeText={setCategoryId}
          autoCapitalize="none"
          placeholder="Paste category UUID from seed"
        />
        <View style={styles.types}>
          {(['School', 'University', 'Skills'] as CourseType[]).map((value) => (
            <Chip
              key={value}
              label={value}
              selected={type === value}
              onPress={() => setType(value)}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={t('tutorDashboard.createSubmit')}
          onPress={onSubmit}
          loading={loading}
          disabled={!title || !description || !categoryId}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { ...typography.caption, color: colors.error },
});
