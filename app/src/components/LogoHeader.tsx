import Logo from "../assets/logo.png";

interface LogoHeaderProps {}

const LogoHeader: React.FC<LogoHeaderProps> = () => {
  return (
    <div className="w-full flex justify-center">
      <img src={Logo} alt="Logo" width={120} />
    </div>
  );
};

export default LogoHeader;
