import { useState } from 'react';
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Choose your role and fill in your details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="university" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="university">University</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
              </TabsList>

              {/* University Signup */}
              <TabsContent value="university">
                <form onSubmit={universityForm.handleSubmit(onUniversitySubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uni-name">University Name</Label>
                    <Input
                      id="uni-name"
                      placeholder="MIT"
                      {...universityForm.register('name', { required: 'Name is required' })}
                    />
                    {universityForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{universityForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uni-email">Email</Label>
                    <Input
                      id="uni-email"
                      type="email"
                      placeholder="admin@university.edu"
                      {...universityForm.register('email', { required: 'Email is required' })}
                    />
                    {universityForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{universityForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uni-password">Password</Label>
                    <Input
                      id="uni-password"
                      type="password"
                      {...universityForm.register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                    />
                    {universityForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{universityForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uni-confirm">Confirm Password</Label>
                    <Input
                      id="uni-confirm"
                      type="password"
                      {...universityForm.register('confirmPassword', { required: 'Confirm password' })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                      {...studentForm.register('name', { required: 'Name is required' })}
                    />
                    {studentForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{studentForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-regno">Registration Number</Label>
                    <Input
                      id="stu-regno"
                      placeholder="2024CS001"
                      {...studentForm.register('regNo', { required: 'Reg No is required' })}
                    />
                    {studentForm.formState.errors.regNo && (
                      <p className="text-sm text-destructive">{studentForm.formState.errors.regNo.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-universityId">University ID (UUID)</Label>
                    <Input
                      id="stu-universityId"
                      type="text"
                      placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                      {...studentForm.register('universityId', { required: 'University ID is required' })}
                    />
                    {studentForm.formState.errors.universityId && (
                      <p className="text-sm text-destructive">{studentForm.formState.errors.universityId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-email">Email</Label>
                    <Input
                      id="stu-email"
                      type="email"
                      placeholder="student@university.edu"
                      {...studentForm.register('email', { required: 'Email is required' })}
                    />
                    {studentForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{studentForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-password">Password</Label>
                    <Input
                      id="stu-password"
                      type="password"
                      {...studentForm.register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                    />
                    {studentForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{studentForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stu-confirm">Confirm Password</Label>
                    <Input
                      id="stu-confirm"
                      type="password"
                      {...studentForm.register('confirmPassword', { required: 'Confirm password' })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Student Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
