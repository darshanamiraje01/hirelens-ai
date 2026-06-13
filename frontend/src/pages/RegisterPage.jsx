import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Zap, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register: signup }       = useAuth();
  const navigate                   = useNavigate();
  const [show, setShow]            = useState(false);
  const [loading, setLoading]      = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success("Account created! Welcome 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-acid/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl">
            <span className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </span>
            Hire<span className="text-brand">Lens</span>
          </Link>
          <p className="text-white/40 text-sm mt-2">Create your free account</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { id: "name",     label: "Full Name", type: "text",     placeholder: "Rahul Sharma",     rules: { required: "Name is required", minLength: { value: 2, message: "Min 2 chars" } } },
              { id: "email",    label: "Email",     type: "email",    placeholder: "you@example.com",  rules: { required: "Email is required" } },
            ].map(({ id, label, type, placeholder, rules }) => (
              <div key={id}>
                <label className="text-sm text-white/60 block mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm outline-none transition-all
                    placeholder:text-white/20 focus:border-brand/50 focus:bg-brand/5
                    ${errors[id] ? "border-red-500/50" : "border-white/10"}`}
                  {...register(id, rules)} />
                {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id].message}</p>}
              </div>
            ))}

            <div>
              <label className="text-sm text-white/60 block mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? "text" : "password"} placeholder="Min 6 characters"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all
                    placeholder:text-white/20 focus:border-brand/50 focus:bg-brand/5
                    ${errors.password ? "border-red-500/50" : "border-white/10"}`}
                  {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 characters" } })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-acid text-ink font-display font-bold py-3.5 rounded-xl hover:bg-acid-dark transition-colors disabled:opacity-50 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand hover:text-brand-light transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
