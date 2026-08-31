<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPhoneOtpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phoneNumber' => ['required', 'string', 'regex:/^0\d{9,10}$/'],
            'code' => ['required', 'string', 'size:6'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phoneNumber.regex' => 'Phone number must start with 0 and be 10-11 digits long.',
            'code.size' => 'The verification code must be 6 digits.',
        ];
    }
}
