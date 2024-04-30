import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
export const authOptions = {
 providers: [
  GoogleProvider({
   clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
   clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET!,
  }),
 ],
 session: {
  strategy: 'jwt',
 },
};
export default NextAuth(authOptions);