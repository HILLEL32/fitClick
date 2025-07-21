import { useContext, useEffect, useState } from "react";
// import { analytics } from "../../fireBase/fireBase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userLog_in, setUserLog_in] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(analytics, initializeUser);
        return unsubscribe;
    }, [])

    async function initializeUser(user) {
        if (user) {
            setCurrentUser({ ...user });
            setUserLog_in(true);
        } else {
            setCurrentUser(null);
            setUserLog_in(false);
        }
        setLoading(false);
    }
    const value = {
        currentUser,
        userLog_in,
        loading
    }

    return (
        <AuthContext.Provider value = {value}>
            {!loading && children}
        </AuthContext.Provider>
    )

}