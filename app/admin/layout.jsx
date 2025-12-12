'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Avatar, Typography, Flex, Dropdown, Spin 
} from 'antd';
import { BiSolidDashboard, BiSolidCalculator, BiUser } from 'react-icons/bi';
import { FileTextFilled } from '@ant-design/icons';
import { FaDollarSign } from 'react-icons/fa';
import { HiUserGroup, HiUsers } from 'react-icons/hi';
import { GiPayMoney, GiSprout } from 'react-icons/gi';
import { LuWheat } from 'react-icons/lu';
import { AiFillDollarCircle, AiOutlineAreaChart, AiFillSetting } from 'react-icons/ai';
import { UserOutlined, LogoutOutlined, MailOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// KONFIGURASI MENU (Sesuai Tabel PRD & Prinsip Transparansi)
const menuConfig = [
  // 1. Dashboard: Semua Role
  { key: '1', icon: <BiSolidDashboard />, label: 'Dashboard', path: '/admin', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
  
  // 2. Aset: Admin/Superadmin (CRUD), Investor/Viewer (Read). Operator: Hidden
  { key: '2', icon: <FileTextFilled />, label: 'Asset', path: '/admin/asset', roles: ['Superadmin', 'Admin', 'Investor', 'Viewer'] },
  
  // 3. Pendanaan: Admin/Superadmin (CRUD), Investor/Viewer (Read). Operator: Hidden
  { key: '4', icon: <FaDollarSign />, label: 'Pendanaan', path: '/admin/pendanaan', roles: ['Superadmin', 'Admin', 'Investor', 'Viewer'] },
  
  // 4. Kepemilikan: Admin/Superadmin (CRUD), Investor/Viewer (Read). Operator: Hidden
  { key: '5', icon: <HiUserGroup />, label: 'Kepemilikan', path: '/admin/kepemilikan', roles: ['Superadmin', 'Admin', 'Investor', 'Viewer'] },
  
  // 5. Proyek: Semua Role Boleh Lihat (Transparansi). CUD hanya Admin/Superadmin.
  { key: '7', icon: <BiSolidCalculator />, label: 'Proyek', path: '/admin/proyek', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
  
  // 6. Pengeluaran: Admin/Superadmin (Full), Operator (Input), Investor/Viewer (Read)
  { key: '6', icon: <GiPayMoney />, label: 'Pengeluaran', path: '/admin/pengeluaran', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
  
  // 7. Produksi: Admin/Superadmin (Full), Operator (Input), Investor/Viewer (Read)
  { key: '8', icon: <LuWheat />, label: 'Produksi', path: '/admin/produksi', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
  
  // 8. Bagi Hasil: Admin/Superadmin (Full), Investor (Read Own), Viewer (Read). Operator: Hidden
  { key: '9', icon: <AiFillDollarCircle />, label: 'Bagi Hasil', path: '/admin/bagi-hasil', roles: ['Superadmin', 'Admin', 'Investor', 'Viewer'] },
  
  // 9. Laporan: Semua Role
  { key: '10', icon: <AiOutlineAreaChart />, label: 'Laporan', path: '/admin/laporan', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
  
  // User Management: Superadmin Only
  { key: '11', icon: <HiUsers />, label: 'User Management', path: '/admin/user-management', roles: ['Superadmin'] },
  
  // Investor Management: Superadmin & Admin
  { key: '3', icon: <BiUser />, label: 'Data Investor', path: '/admin/investor', roles: ['Superadmin', 'Admin'] },

  // Pengaturan: Semua
  { key: '12', icon: <AiFillSetting />, label: 'Pengaturan', path: '/admin/pengaturan', roles: ['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer'] },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeAuth();
    setMounted(true);
  }, [initializeAuth]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  const userRoleName = user?.role?.name || user?.role;

  const profileMenuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username || 'Loading...'}</Text>,
      children: [
        {
          key: 'email',
          icon: <MailOutlined />,
          label: user?.email || '...',
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        {
          key: 'role',
          icon: <UserSwitchOutlined />,
          label: userRoleName || 'Role not found', 
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  let determinedKey = '1';
  const sortedMenuConfig = [...menuConfig].sort((a, b) => b.path.length - a.path.length);
  const matchedItem = sortedMenuConfig.find((item) => pathname.startsWith(item.path));
  if (matchedItem) determinedKey = matchedItem.key;
  const selectedKey = determinedKey;

  const baseStyle = {
    height: '40px', display: 'flex', alignItems: 'center', paddingLeft: '24px',
    borderRadius: 0, width: '100%', margin: '0px', backgroundColor: 'rgba(255, 255, 255, 0.00001)',
  };
  const activeStyleAddons = { backgroundColor: '#E6FFE6' };
  const baseIconSize = '18px';
  const iconTextGap = '10px';

  // Filter menu logic
  const processedMenuItems = menuConfig
    .filter(item => {
      if (!mounted || !userRoleName) return false; 
      // Cek apakah role user ada di daftar roles yang diizinkan menu
      if (item.roles && !item.roles.includes(userRoleName)) return false;
      return true;
    })
    .map((item) => {
      const isActive = selectedKey === item.key;
      const currentStyle = isActive ? { ...baseStyle, ...activeStyleAddons } : baseStyle;
      const iconColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';
      const textColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';

      return {
        key: item.key,
        icon: React.cloneElement(item.icon, {
          style: { fontSize: baseIconSize, color: iconColor, width: baseIconSize, height: baseIconSize },
        }),
        label: (
          <span style={{ color: textColor, fontFamily: 'Roboto, sans-serif', fontSize: '14px', marginLeft: iconTextGap, flexGrow: 1 }}>
            {item.label}
          </span>
        ),
        style: currentStyle,
        onClick: () => router.push(item.path),
      };
    });

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }} suppressHydrationWarning>
      <Header
        style={{
          background: '#FFFFFF', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)', height: 84, position: 'sticky', top: 0, zIndex: 20, width: '100%',
        }}
      >
        <Flex align="center" gap="12px">
          <GiSprout style={{ fontSize: '32px', color: '#237804' }} />
          <Title level={4} style={{ margin: 0, color: '#111928', fontWeight: 600, fontSize: '24px' }}>
            Lahan Pintar
          </Title>
        </Flex>
        
        <Dropdown menu={{ items: profileMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow trigger={['click']}>
          <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
             {mounted && user ? (
                 <>
                   <Text strong style={{ marginRight: 8 }}>{user.username}</Text>
                   <Avatar size={32} icon={<UserOutlined />} />
                 </>
             ) : (
                 <Spin size="small" /> 
             )}
          </Flex>
        </Dropdown>
      </Header>

      <Layout style={{ background: '#F9FAFB' }}>
        <Sider
          width={256}
          style={{
            background: '#FFFFFF', boxShadow: 'inset -1px 0px 0px #F0F0F0', position: 'fixed',
            height: 'calc(100vh - 84px)', left: 0, top: '84px', overflow: 'auto',
          }}
          theme="light"
          suppressHydrationWarning
        >
          {mounted && user && (
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={processedMenuItems}
              style={{ borderRight: 0, width: '100%', padding: '0px', gap: '8px', display: 'flex', flexDirection: 'column' }}
            />
          )}
        </Sider>

        <Layout style={{ marginLeft: 256, background: '#F9FAFB' }}>
          <Content style={{ padding: '24px', margin: 0 }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}