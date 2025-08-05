import AppRoutes from "@/routes";
import UserProvider from "@/components/user-provider";

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
