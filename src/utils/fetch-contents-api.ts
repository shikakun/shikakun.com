export async function fetchContentsApi(path: string, params = {}) {
  try {
    const baseUrl = import.meta.env.CONTENTS_API_URL;
    const token = import.meta.env.CONTENTS_API_TOKEN;
    const urlParams = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    const options = { headers: { Authorization: `Bearer ${token}` } };
    const response = await fetch(`${baseUrl}${path}${urlParams}`, options);
    return await response.json();
  } catch (error) {
    console.error(error);
    throw new Error(
      `Please check if your server is running and you set all the required tokens.`
    );
  }
}
