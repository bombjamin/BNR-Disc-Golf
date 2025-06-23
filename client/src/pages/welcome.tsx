import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { User, Phone, Lock, UserPlus, LogIn, Users } from "lucide-react";
import type { RegisterUser, LoginPhone, LoginPassword, VerifyCode, GuestLogin } from "@shared/schema";
import { registerSchema, loginPhoneSchema, loginPasswordSchema, verifyCodeSchema, guestLoginSchema } from "@shared/schema";
import mascotImage from "@assets/image_1749145506063.png";

type WelcomeStep = "choice" | "register" | "verify-register" | "login" | "verify-login" | "guest";

export default function Welcome() {
  const { 
    registerMutation, 
    verifyRegistrationMutation, 
    sendLoginCodeMutation, 
    verifyLoginMutation, 
    loginPasswordMutation, 
    guestLoginMutation 
  } = useAuth();
  
  const [step, setStep] = useState<WelcomeStep>("choice");
  const [pendingPhone, setPendingPhone] = useState("");
  const [loginMethod, setLoginMethod] = useState<"code" | "password">("code");

  const registerForm = useForm<RegisterUser>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const verifyForm = useForm<VerifyCode>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      phoneNumber: "",
      code: "",
      type: "register",
    },
  });

  const loginPhoneForm = useForm<LoginPhone>({
    resolver: zodResolver(loginPhoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const loginPasswordForm = useForm<LoginPassword>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  const guestForm = useForm<GuestLogin>({
    resolver: zodResolver(guestLoginSchema),
    defaultValues: {
      name: "",
    },
  });

  const onRegister = (data: RegisterUser) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setPendingPhone(data.phoneNumber);
        verifyForm.reset({
          phoneNumber: data.phoneNumber,
          code: "",
          type: "register",
        });
        setStep("verify-register");
      },
    });
  };

  const onVerifyRegistration = (data: VerifyCode) => {
    verifyRegistrationMutation.mutate(data);
  };

  const onSendLoginCode = (data: LoginPhone) => {
    sendLoginCodeMutation.mutate(data, {
      onSuccess: () => {
        setPendingPhone(data.phoneNumber);
        verifyForm.reset({
          phoneNumber: data.phoneNumber,
          code: "",
          type: "login",
        });
        setStep("verify-login");
      },
    });
  };

  const onVerifyLogin = (data: VerifyCode) => {
    verifyLoginMutation.mutate(data);
  };

  const onLoginPassword = (data: LoginPassword) => {
    loginPasswordMutation.mutate(data);
  };

  const onGuestLogin = (data: GuestLogin) => {
    guestLoginMutation.mutate(data);
  };

  if (step === "choice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golf-bg to-white flex flex-col items-center justify-center p-4">
        {/* Ranch Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-dark-green mb-2 tracking-wider" style={{ 
            fontFamily: 'Georgia, "Times New Roman", serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.1em'
          }}>
            BAR NONE RANCH
          </h1>
          <p className="text-xl text-gray-600 font-light italic tracking-wide" style={{
            fontFamily: 'Georgia, serif'
          }}>
            Where Champions Throw
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <img 
                src={mascotImage} 
                alt="Disc Golf Mascot" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-dark-green">
              Welcome to Disc Golf Scorekeeper
            </CardTitle>
            <p className="text-gray-600">Choose how you'd like to continue</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setStep("register")}
              className="w-full h-16 bg-golf-green hover:bg-golf-green/80 text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02]"
              size="lg"
            >
              <div className="flex items-center justify-start w-full">
                <UserPlus className="w-5 h-5 mr-4 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-base">Create Account</div>
                  <div className="text-sm opacity-90">Sign up with phone verification</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setStep("login")}
              variant="outline"
              className="w-full h-16 border-2 border-golf-green text-golf-green hover:bg-golf-green hover:text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02]"
              size="lg"
            >
              <div className="flex items-center justify-start w-full">
                <LogIn className="w-5 h-5 mr-4 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-base">Log In</div>
                  <div className="text-sm opacity-70 hover:opacity-90">Access your existing account</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setStep("guest")}
              variant="outline"
              className="w-full h-16 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-500 hover:text-gray-800 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02]"
              size="lg"
            >
              <div className="flex items-center justify-start w-full">
                <Users className="w-5 h-5 mr-4 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-base">Play as Guest</div>
                  <div className="text-sm opacity-70">No account needed</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golf-bg to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-green">Create Account</CardTitle>
            <p className="text-gray-600">We'll send a verification code to your phone</p>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-golf-green hover:bg-golf-green/90"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("choice")}
                >
                  Back
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "verify-register" || step === "verify-login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golf-bg to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-green">
              {step === "verify-register" ? "Verify Your Account" : "Enter Login Code"}
            </CardTitle>
            <p className="text-gray-600">
              Enter the 6-digit code sent to {pendingPhone}
            </p>
          </CardHeader>
          <CardContent>
            <Form {...verifyForm}>
              <form 
                onSubmit={verifyForm.handleSubmit(
                  step === "verify-register" ? onVerifyRegistration : onVerifyLogin
                )} 
                className="space-y-4"
              >
                <FormField
                  control={verifyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          maxLength={6}
                          className="text-center text-2xl tracking-widest"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-golf-green hover:bg-golf-green/90"
                  disabled={verifyRegistrationMutation.isPending || verifyLoginMutation.isPending}
                >
                  {(verifyRegistrationMutation.isPending || verifyLoginMutation.isPending) 
                    ? "Verifying..." 
                    : "Verify Code"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("choice")}
                >
                  Back to Start
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golf-bg to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-green">Log In</CardTitle>
            <p className="text-gray-600">Enter your phone number to continue</p>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as "code" | "password")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">Text Code</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="mt-4">
                <Form {...loginPhoneForm}>
                  <form onSubmit={loginPhoneForm.handleSubmit(onSendLoginCode)} className="space-y-4">
                    <FormField
                      control={loginPhoneForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-golf-green hover:bg-golf-green/90"
                      disabled={sendLoginCodeMutation.isPending}
                    >
                      {sendLoginCodeMutation.isPending ? "Sending Code..." : "Send Login Code"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                <Form {...loginPasswordForm}>
                  <form onSubmit={loginPasswordForm.handleSubmit(onLoginPassword)} className="space-y-4">
                    <FormField
                      control={loginPasswordForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-golf-green hover:bg-golf-green/90"
                      disabled={loginPasswordMutation.isPending}
                    >
                      {loginPasswordMutation.isPending ? "Logging In..." : "Log In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setStep("choice")}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "guest") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-golf-bg to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-dark-green">Play as Guest</CardTitle>
            <p className="text-gray-600">Enter your name to get started</p>
          </CardHeader>
          <CardContent>
            <Form {...guestForm}>
              <form onSubmit={guestForm.handleSubmit(onGuestLogin)} className="space-y-4">
                <FormField
                  control={guestForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-golf-green hover:bg-golf-green/90"
                  disabled={guestLoginMutation.isPending}
                >
                  {guestLoginMutation.isPending ? "Starting..." : "Start Playing"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("choice")}
                >
                  Back
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}