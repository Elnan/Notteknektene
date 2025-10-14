import React from "react";
import styles from "./Button.module.css";

const Button = ({
  variant = "primary",
  size = "large",
  children,
  className = "",
  ...props
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
