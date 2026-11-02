import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, Clock, User as UserIcon, BarChart, ChefHat, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Here's what's happening with your account today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Links based on Role */}
          {(user.role === 'customer' || user.role === 'admin') && (
            <DashboardCard
              title="Browse Menu"
              description="Explore our healthy and delicious options."
              icon={<Utensils size={24} className="text-orange-500" />}
              linkTo="/common-foods"
              color="bg-orange-50 dark:bg-orange-900/20"
            />
          )}

          {(user.role === 'customer' || user.role === 'admin') && (
            <DashboardCard
              title="Your Orders"
              description="Track your active orders and view history."
              icon={<Clock size={24} className="text-blue-500" />}
              linkTo="/orders"
              color="bg-blue-50 dark:bg-blue-900/20"
            />
          )}

          <DashboardCard
            title="Profile Settings"
            description="Update your personal details and health profile."
            icon={<UserIcon size={24} className="text-purple-500" />}
            linkTo="/profile"
            color="bg-purple-50 dark:bg-purple-900/20"
          />

          {user.role === 'admin' && (
            <DashboardCard
              title="Admin Panel"
              description="Manage users, restaurants, and view metrics."
              icon={<BarChart size={24} className="text-red-500" />}
              linkTo="/admin-dashboard"
              color="bg-red-50 dark:bg-red-900/20"
            />
          )}

          {user.role === 'restaurant' && (
            <DashboardCard
              title="Kitchen Dashboard"
              description="Manage your menu and active orders."
              icon={<ChefHat size={24} className="text-green-500" />}
              linkTo="/restaurant-dashboard"
              color="bg-green-50 dark:bg-green-900/20"
            />
          )}

          {user.role === 'driver' && (
            <DashboardCard
              title="Deliveries"
              description="View pending and active delivery routes."
              icon={<MapPin size={24} className="text-teal-500" />}
              linkTo="/delivery-dashboard"
              color="bg-teal-50 dark:bg-teal-900/20"
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon, linkTo, color }) => (
  <Link to={linkTo} className="block group">
    <div className={`p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all h-full flex flex-col`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
        {title}
        <ArrowRight size={18} className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-grow">
        {description}
      </p>
    </div>
  </Link>
);

export default Dashboard;
