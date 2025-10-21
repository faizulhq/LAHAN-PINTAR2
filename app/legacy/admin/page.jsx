// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { getUser, logout } from '@/lib/auth';

// export default function AdminPage() {
//   const router = useRouter();
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const currentUser = getUser();
//     if (!currentUser || currentUser.role !== 'admin') {
//       router.push('/login');
//     } else {
//       setUser(currentUser);
//     }
//   }, []);

//   if (!user) return <p>Loading...</p>;

//   return (
//     <div>
//       <h2>Admin Panel</h2>
//       <p>Welcome, {user.username}</p>
//       <button
//         onClick={() => {
//           logout();
//           router.push('/login');
//         }}
//       >
//         Logout
//       </button>
//     </div>
//   );
// }

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/app/legacy/lib/auth';
import { Typography, Card, Button, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'admin') {
      message.warning('Akses ditolak. Hanya admin yang bisa mengakses.');
      router.replace('/auth');
    } else {
      setUser(currentUser);
    }
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Card>
        <Typography.Title level={2}>Admin Panel</Typography.Title>
        <Typography.Paragraph>
          Selamat datang, <strong>{user.username}</strong>
        </Typography.Paragraph>
        <Typography.Paragraph>
          Role Anda: <span className="font-semibold">{user.role}</span>
        </Typography.Paragraph>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => {
            logout();
            router.replace('/auth');
          }}
        >
          Logout
        </Button>
      </Card>
    </div>
  );
}
