// Minimal redirect page: forward legacy /admin-actions to the modern /admin dashboard.
import { GetServerSideProps } from 'next';
import { isAdminRequest } from '../lib/admin';

export default function Page() {
  // no client UI needed; this page redirects on the server when admin, 404 otherwise.
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, res } = context;
  if (!isAdminRequest(req as any)) {
    res.statusCode = 404;
    return { notFound: true };
  }

  return {
    redirect: { destination: '/admin', permanent: false },
  };
};
