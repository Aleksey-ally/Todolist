import React, { ChangeEvent, useState } from "react";
import { TextField } from "@mui/material";

type EditableSpanPropsType = {
  value: string;
  onChange: (newValue: string) => void;
};

export const EditableSpan = React.memo(function (props: EditableSpanPropsType) {
  let [editMode, setEditMode] = useState(false);
  let [title, setTitle] = useState(props.value);

  const activateEditMode = () => {
    setEditMode(true);
    setTitle(props.value);
  };
  const activateViewMode = () => {
    setEditMode(false);
    props.onChange(title);
  };
  const changeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.currentTarget.value);
  };

  return editMode ? (
    <TextField
      InputProps={{
        style: {
          color: "#ffffff"
        }
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#7D7D7D" // Цвет рамки
          },
          "&:hover fieldset": {
            borderColor: "#7D7D7D" // Цвет рамки при hover
          },
          "&.Mui-focused fieldset": {
            borderColor: "#7D7D7D" // Цвет рамки при фокусе
          }
        }
      }}
      value={title} onChange={changeTitle} autoFocus onBlur={activateViewMode} />
  ) : (
    <span onDoubleClick={activateEditMode}>{props.value}</span>
  );
});
