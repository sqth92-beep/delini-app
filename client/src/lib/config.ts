export const config = {
  BASE_URL: "https://delini-backend.onrender.com",
  
  isCapacitor(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).Capacitor !== 'undefined';
  },
  
  getFullUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.BASE_URL}${cleanPath}`;
  },
  
  getHeaders(requireAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      "Accept": "application/json",
    };
    
    if (requireAuth) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    return headers;
  },
  
  getContentHeaders(requireAuth: boolean = false): Record<string, string> {
    const headers = this.getHeaders(requireAuth);
    headers["Content-Type"] = "application/json";
    return headers;
  }
};
