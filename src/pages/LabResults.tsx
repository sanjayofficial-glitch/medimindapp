const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.familyMemberId || !formData.testName || !formData.value) {
    return toast.error("Please fill in required fields");
  }
  try {
    // Upload attachment if exists
    let fileUrl = "";
    if (formData.attachment) {
      fileUrl = await uploadFile(formData.attachment);
    }

    // Pass value as string; storage layer will convert to number
    await addLabResult({
      family_member_id: formData.familyMemberId,
      test_name: formData.testName,
      value: formData.value,               // <-- corrected
      unit: formData.unit,
      date: formData.date,
      normal_range: formData.normalRange,
      file_url: fileUrl,
    });

    await loadData();
    setShowAdd(false);
    setFormData({
      familyMemberId: "",
      testName: "",
      value: "",
      unit: "",
      date: new Date().toISOString().split('T')[0],
      normalRange: "",
      attachment: null,
    });
    toast.success("Lab result added with file!");
  } catch (error) {
    toast.error("Failed to add lab result");
    console.error("Error adding lab result:", error);
  }
};