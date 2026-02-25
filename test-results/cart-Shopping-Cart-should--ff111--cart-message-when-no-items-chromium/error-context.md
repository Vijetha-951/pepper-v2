# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - generic [ref=e9]:
      - heading "Welcome Back!" [level=1] [ref=e10]
      - paragraph [ref=e11]: Thekkevayalil Pepper Nursery
      - paragraph [ref=e12]: Sign in to access your account and explore our premium pepper collection.
  - generic [ref=e14]:
    - generic [ref=e15]:
      - heading "Sign In" [level=2] [ref=e16]
      - paragraph [ref=e17]: Access your account
    - generic [ref=e18]:
      - generic [ref=e20]:
        - img [ref=e21]
        - textbox "Email Address" [ref=e24]
      - generic [ref=e26]:
        - img [ref=e27]
        - textbox "Password" [ref=e30]
        - button [ref=e31] [cursor=pointer]:
          - img [ref=e32]
      - link "Forgot password?" [ref=e36] [cursor=pointer]:
        - /url: /forgot-password
      - button "Sign In" [ref=e37] [cursor=pointer]
    - generic [ref=e40]: Or continue with
    - button "Sign in with Google" [ref=e42] [cursor=pointer]:
      - img [ref=e43]
      - generic [ref=e48]: Sign in with Google
    - paragraph [ref=e49]:
      - text: Don't have an account?
      - link "Create Account" [ref=e50] [cursor=pointer]:
        - /url: /register
```