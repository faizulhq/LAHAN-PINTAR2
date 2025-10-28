// app/admin/layout.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Avatar, Typography, Flex, Dropdown,
} from 'antd';
import { BiSolidDashboard, BiSolidCalculator, BiUser } from 'react-icons/bi';
import { FileTextFilled, UserAddOutlined } from '@ant-design/icons';
import { FaDollarSign } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';
import { GiPayMoney, GiSprout } from 'react-icons/gi';
import { LuWheat } from 'react-icons/lu';
import { AiFillDollarCircle, AiOutlineAreaChart, AiFillSetting } from 'react-icons/ai';
import { UserOutlined, LogoutOutlined, MailOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const menuConfig = [
  { key: '1', icon: <BiSolidDashboard />, label: 'Dashboard', path: '/admin' },
  { key: '2', icon: <FileTextFilled />, label: 'Asset', path: '/admin/asset' },
  { key: '3', icon: <BiUser />, label: 'Investor', path: '/admin/investor' },
  { key: '4', icon: <FaDollarSign />, label: 'Pendanaan', path: '/admin/pendanaan' },
  { key: '5', icon: <HiUserGroup />, label: 'Kepemilikan', path: '/admin/kepemilikan' },
  { key: '6', icon: <GiPayMoney />, label: 'Pengeluaran', path: '/admin/pengeluaran' },
  { key: '7', icon: <BiSolidCalculator />, label: 'Proyek', path: '/admin/proyek' },
  { key: '8', icon: <LuWheat />, label: 'Produksi', path: '/admin/produksi' },
  { key: '9', icon: <AiFillDollarCircle />, label: 'Bagi Hasil', path: '/admin/bagi-hasil' },
  { key: '10', icon: <AiOutlineAreaChart />, label: 'Laporan', path: '/admin/laporan' },
  { key: '11', icon: <AiFillSetting />, label: 'Pengaturan', path: '/admin/pengaturan' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  
  // Prevent hydration mismatch - hanya render menu di client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  const profileMenuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username || 'Username'}</Text>,
      children: [
        {
          key: 'email',
          icon: <MailOutlined />,
          label: user?.email || 'Email not found',
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        {
          key: 'role',
          icon: <UserSwitchOutlined />,
          label: user?.role || 'Role not found',
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

  // Tentukan selected key
  let determinedKey = '1';
  const sortedMenuConfig = [...menuConfig].sort((a, b) => b.path.length - a.path.length);
  const matchedItem = sortedMenuConfig.find((item) => pathname.startsWith(item.path));
  if (matchedItem) determinedKey = matchedItem.key;
  const selectedKey = determinedKey;

  // Style dasar untuk menu item
  const baseStyle = {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '24px',
    borderRadius: 0,
    width: '100%',
    margin: '0px',
    backgroundColor: 'rgba(255, 255, 255, 0.00001)',
  };

  const activeStyleAddons = {
    backgroundColor: '#E6FFE6',
  };

  const baseIconSize = '18px';
  const iconTextGap = '10px';

  // Proses menu items tanpa Link (gunakan onClick untuk navigasi)
  const processedMenuItems = menuConfig.map((item) => {
    const isActive = selectedKey === item.key;
    const currentStyle = isActive ? { ...baseStyle, ...activeStyleAddons } : baseStyle;
    const iconColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';
    const textColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';

    return {
      key: item.key,
      icon: React.cloneElement(item.icon, {
        style: {
          fontSize: baseIconSize,
          color: iconColor,
          width: baseIconSize,
          height: baseIconSize,
        },
      }),
      label: (
        <span
          style={{
            color: textColor,
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '22px',
            marginLeft: iconTextGap,
            flexGrow: 1,
          }}
        >
          {item.label}
        </span>
      ),
      style: currentStyle,
      onClick: () => router.push(item.path), // Navigasi dengan onClick
    };
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }} suppressHydrationWarning>
      <Header
        style={{
          background: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1), 0px 1px 4px rgba(12, 12, 13, 0.05)',
          height: 84,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
        }}
      >
        <Flex align="center" gap="12px">
          <GiSprout style={{ fontSize: '32px', color: '#237804' }} />
          <Title
            level={4}
            style={{
              margin: 0,
              color: '#111928',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '150%',
            }}
          >
            Lahan Pintar
          </Title>
        </Flex>
        <Dropdown
          menu={{ items: profileMenuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          arrow
          trigger={['click']}
        >
          <Avatar size={32} icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Header>

      <Layout style={{ background: '#F9FAFB' }}>
        <Sider
          width={256}
          style={{
            background: '#FFFFFF',
            boxShadow: 'inset -1px 0px 0px #F0F0F0',
            position: 'fixed',
            height: 'calc(100vh - 84px)',
            left: 0,
            top: '84px',
            overflow: 'auto',
          }}
          theme="light"
          suppressHydrationWarning
        >
          {/* Render menu hanya setelah mounted di client */}
          {mounted && (
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={processedMenuItems}
              style={{
                borderRight: 0,
                width: '100%',
                padding: '0px',
                gap: '8px',
                display: 'flex',
                flexDirection: 'column',
              }}
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