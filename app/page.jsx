'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/app/legacy/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  }, []);

  return <p>Loading...</p>;
}
