import { Link } from "react-router-dom";

export default function StepsProgress() {
  return (
    <div className="flex flex-col items-center justify-center py-3">
  <div className="flex items-center gap-10 relative">
    <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full -z-10"></div>

    <div className="flex flex-col items-center relative z-10">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white font-semibold shadow-md shadow-amber-300/40">
        1
      </div>
      <Link
        to={"/register"}
        className="mt-2 text-sm text-gray-500 hover:text-white transition-colors font-medium"
      >
        Sign Up
      </Link>
    </div>

    <div className="flex flex-col items-center relative z-10">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white font-semibold shadow-md shadow-amber-300/40">
        2
      </div>
      <Link
        to={"/confirm"}
        className="mt-2 text-sm text-gray-500 hover:text-white transition-colors font-medium"
      >
        Confirm
      </Link>
    </div>

    <div className="flex flex-col items-center relative z-10">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white font-semibold shadow-md shadow-amber-300/40">
        3
      </div>
      <Link
        to={"/signIn"}
        className="mt-2 text-sm text-gray-500 hover:text-white transition-colors font-medium"
      >
        Sign In
      </Link>
    </div>
  </div>
</div>

  );
}
