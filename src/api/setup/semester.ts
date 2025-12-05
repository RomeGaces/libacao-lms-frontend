
export function getSemesters() {
  return useGet('/semesters');
}

export function createSemester(data: any) {
  return usePost('/semesters', data);
}

export function updateSemester(id: number, data: any) {
  return usePut(`/semesters/${id}`, data);
}

export function deleteSemester(id: number) {
  return useDelete(`/semesters/${id}`);
}