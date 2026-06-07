export function getSemesterFromDate(date = new Date()) {
  const month = date.getMonth() + 1;
  const isSecondSemester = month > 1 && month < 8;

  return {
    year: date.getFullYear() - (isSecondSemester ? 1912 : 1911),
    sem: isSecondSemester ? 2 : 1,
  };
}
