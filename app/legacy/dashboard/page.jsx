// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { getUser, logout } from '@/lib/auth';

// export default function Dashboard() {
//   const router = useRouter();
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const currentUser = getUser();
//     if (!currentUser) {
//       router.push('/login');
//     } else {
//       setUser(currentUser);
//     }
//   }, []);

//   if (!user) return <p>Loading...</p>;

//   return (
//     <div>
//       <h2>Welcome, {user.username}</h2>
//       <p>Role: {user.role}</p>
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
import { Typography, Button, Card } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) router.replace('/auth');
    else setUser(currentUser);
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <Card>
        <Typography.Title level={3}>Welcome, {user.username}</Typography.Title>
        <Typography.Paragraph>Role: {user.role}</Typography.Paragraph>
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
