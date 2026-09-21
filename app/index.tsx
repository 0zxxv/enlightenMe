import { Redirect } from 'expo-router';

/** Root entry always opens Welcome first. */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
