// Minimal redirect page: forward legacy /admin-actions to the modern /admin dashboard.
import { GetServerSideProps } from 'next';

export default function Page() {
  // no client UI needed; this page redirects on the server.
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/admin', permanent: false },
});
