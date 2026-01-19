def remove_repeating_chars(s):
    if not s:
        return ""

    result = [s[0]]
    for char in s[1:]:
        if char != result[-1]:
            result.append(char)

    return ''.join(result)


if __name__ == "__main__":
    test_input = "XXAaaAAAHHhHHHHjjJJkLL"
    output = remove_repeating_chars(test_input)
    print(f"Input:  {test_input}")
    print(f"Output: {output}")
