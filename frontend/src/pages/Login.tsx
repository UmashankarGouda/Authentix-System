import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface LoginForm {
  email: string;
  password: string;
  role: 'university' | 'student';
}

export default function Login() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.role);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-zinc-200/50 dark:bg-grid-zinc-800/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 container flex items-center justify-center pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="space-y-1 text-center pb-8">
                <CardTitle className="text-2xl font-bold tracking-tight">Login Your Account</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  Select your role and enter credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Role</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 has-[:checked]:border-zinc-900 dark:has-[:checked]:border-zinc-100 has-[:checked]:bg-zinc-50 dark:has-[:checked]:bg-zinc-800/50">
                        <input
                          type="radio"
                          value="university"
                          {...register('role', { required: 'Please select a role' })}
                          defaultChecked
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">University</span>
                      </label>
                      <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-center transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 has-[:checked]:border-zinc-900 dark:has-[:checked]:border-zinc-100 has-[:checked]:bg-zinc-50 dark:has-[:checked]:bg-zinc-800/50">
                        <input
                          type="radio"
                          value="student"
                          {...register('role', { required: 'Please select a role' })}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">Student</span>
                      </label>
                    </div>
                    {errors.role && (
                      <p className="text-sm text-red-500">{errors.role.message}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...register('email', { required: 'Email is required' })}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link to="#" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...register('password', { required: 'Password is required' })}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <Button variant="outline" className="h-11 w-full rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all" type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Login with Google
                </Button>

                <div className="text-center text-sm text-zinc-500">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
