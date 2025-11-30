export const authService = {
    baseUrl: 'http://localhost:8080',
    login: async (email: string, password: string) => {
        return new Promise<{ token: string }>((resolve, reject) => {
            fetch(`${authService.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Login successful, received token:', data.accessToken);
                    localStorage.setItem('authToken', data.accessToken);
                    resolve({ token: data.accessToken });
                })
                .catch(error => {
                    reject('Login failed: ' + error.message);
                });

        });
    },
    regiser: async (username: string, email: string, password: string) => {
        return new Promise<{ message: string }>((resolve, reject) => {
            fetch(`${authService.baseUrl}/user/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, sessionHistory: [], quizHistory: [] }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    resolve({ message: data.message });
                })
                .catch(error => {
                    reject('Registration failed: ' + error.message);
                });
        });
    },
    getLoggedInUser: async (token: string) => {
        console.log('Fetching logged in user with token:', token);
        return new Promise<{userId: string, avatarUrl: string, createdAt: string, username: string; email: string }>((resolve, reject) => {
            fetch(`${authService.baseUrl}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Fetched user data:', data);
                    const accessToken = localStorage.getItem('authToken') || '';
                    let user = JSON.parse(atob(accessToken.split('.')[1]));
                    resolve({userId: user.userId, avatarUrl: user.avatarUrl, createdAt: user.createdAt, username: user.username, email: user.email });
                })
                .catch(error => {
                    reject('Failed to fetch user: ' + error.message);
                });
        });
    },
    logout: () => {
        localStorage.removeItem('authToken');
    }
};  