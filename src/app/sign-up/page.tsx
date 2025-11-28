"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AnimeBackground } from "@/components/anime-background";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { type SignUpInput, signUpSchema } from "@/lib/zod-schemas";

export default function SignUp() {
  const { register, isSigningUp } = useAuth();
  const router = useRouter();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignUpInput) => {
    if (isSigningUp) return;
    const success = await register(values);
    if (success) {
      router.push("/chat");
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <AnimeBackground />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-2 border-pink-200 dark:border-pink-800 backdrop-blur-md bg-background/95 before:absolute before:inset-0 before:rounded-lg before:bg-linear-to-br before:from-pink-50/50 before:via-transparent before:to-purple-50/50 before:pointer-events-none dark:before:from-pink-950/30 dark:before:to-purple-950/30">
          <CardHeader className="flex flex-col items-center justify-center gap-4 pb-8 pt-10">
            <Logo />
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create an account
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Full name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Create a strong password"
                          type="password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isSigningUp}
                  type="submit"
                  className="w-full h-11 mt-2 font-medium"
                >
                  {isSigningUp && <Spinner />}
                  {isSigningUp ? "Creating account..." : "Create account"}
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Already registered?{" "}
                  <Link
                    href="/"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign in instead
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
