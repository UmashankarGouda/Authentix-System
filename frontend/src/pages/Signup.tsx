import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, UniversityOption } from '@/lib/api';

interface UniversityForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface StudentForm {
  name: string;
  regNo: string;
  email: string;
  password: string;
  confirmPassword: string;
  universityId: string;
}

export default function Signup() {
  const { signupUniversity, signupStudent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const universityForm = useForm<UniversityForm>();
  const studentForm = useForm<StudentForm>();
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [universityQuery, setUniversityQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const data = await authAPI.getUniversities();
        setUniversities(data);
      } catch (error) {
        toast.error('Failed to load universities');
      }
    };

    loadUniversities();
  }, []);

  const filteredUniversities = universities.filter((u) =>
    u.name.toLowerCase().includes(universityQuery.toLowerCase())
  );

  const onUniversitySubmit = async (data: UniversityForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signupUniversity(data.name, data.email, data.password);
      toast.success('University account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onStudentSubmit = async (data: StudentForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signupStudent(data.name, data.regNo, data.email, data.password, data.universityId);
      toast.success('Student account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed');
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
          <Card className="w-full max-w-lg border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold tracking-tight">Create Your Account</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Join the network as a University or Student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="university" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <TabsTrigger
                    value="university"
                    className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all"
                  >
                    University
                  </TabsTrigger>
                  <TabsTrigger
                    value="student"
                    className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm transition-all"
                  >
                    Student
                  </TabsTrigger>
                </TabsList>

                {/* University Signup */}
                <TabsContent value="university">
                  <form onSubmit={universityForm.handleSubmit(onUniversitySubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="uni-name">University Name</Label>
                      <Input
                        id="uni-name"
                        placeholder="MIT"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...universityForm.register('name', { required: 'Name is required' })}
                      />
                      {universityForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{universityForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uni-email">Email</Label>
                      <Input
                        id="uni-email"
                        type="email"
                        placeholder="admin@university.edu"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...universityForm.register('email', { required: 'Email is required' })}
                      />
                      {universityForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{universityForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="uni-password">Password</Label>
                        <Input
                          id="uni-password"
                          type="password"
                          className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                          {...universityForm.register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                        />
                        {universityForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{universityForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="uni-confirm">Confirm</Label>
                        <Input
                          id="uni-confirm"
                          type="password"
                          className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                          {...universityForm.register('confirmPassword', { required: 'Confirm password' })}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create University Account'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Student Signup */}
                <TabsContent value="student">
                  <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stu-name">Full Name</Label>
                      <Input
                        id="stu-name"
                        placeholder="John Doe"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...studentForm.register('name', { required: 'Name is required' })}
                      />
                      {studentForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{studentForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stu-regno">Registration Number</Label>
                      <Input
                        id="stu-regno"
                        placeholder="2024CS001"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...studentForm.register('regNo', { required: 'Reg No is required' })}
                      />
                      {studentForm.formState.errors.regNo && (
                        <p className="text-sm text-red-500">{studentForm.formState.errors.regNo.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 relative">
                      <Label htmlFor="stu-university">University</Label>
                      <Input
                        id="stu-university"
                        placeholder="Start typing your university name"
                        value={selectedUniversity ? selectedUniversity.name : universityQuery}
                        onChange={(e) => {
                          setSelectedUniversity(null);
                          setUniversityQuery(e.target.value);
                          setShowUniversityDropdown(true);
                          studentForm.setValue('universityId', '');
                        }}
                        onFocus={() => setShowUniversityDropdown(true)}
                        autoComplete="off"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                      />
                      <input
                        type="hidden"
                        {...studentForm.register('universityId', { required: 'University is required' })}
                      />
                      {studentForm.formState.errors.universityId && (
                        <p className="text-sm text-red-500">{studentForm.formState.errors.universityId.message}</p>
                      )}

                      {showUniversityDropdown && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
                          {filteredUniversities.length > 0 ? (
                            filteredUniversities.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                onClick={() => {
                                  setSelectedUniversity(u);
                                  setUniversityQuery('');
                                  studentForm.setValue('universityId', u.id, { shouldValidate: true });
                                  setShowUniversityDropdown(false);
                                }}
                              >
                                {u.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-zinc-500">
                              No universities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stu-email">Email</Label>
                      <Input
                        id="stu-email"
                        type="email"
                        placeholder="student@university.edu"
                        className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                        {...studentForm.register('email', { required: 'Email is required' })}
                      />
                      {studentForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{studentForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stu-password">Password</Label>
                        <Input
                          id="stu-password"
                          type="password"
                          className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                          {...studentForm.register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                        />
                        {studentForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{studentForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stu-confirm">Confirm</Label>
                        <Input
                          id="stu-confirm"
                          type="password"
                          className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent px-4 transition-colors focus:border-zinc-900 dark:focus:border-zinc-100"
                          {...studentForm.register('confirmPassword', { required: 'Confirm password' })}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Student Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
