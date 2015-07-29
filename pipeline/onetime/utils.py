import phonenumbers as ph

def __standardize(number):
  num = u"+{}".format(number.lstrip("+"))
  try:
    x = ph.parse(num)
  except ph.phonenumberutil.NumberParseException:
    return None

  if ph.is_valid_number(x):
    return ph.format_number(x, ph.PhoneNumberFormat.E164).lstrip("+")
  else:
    return None

def standardize_number(number):
  # only try parsing as a US number
  return __standardize(u"+1{}".format(number.lstrip("+")))

def standardize_numbers(phone_numbers):
  return filter(None, map(standardize_number, phone_numbers))

if __name__ == "__main__":
  my_nums = ["650 450 3926", "(650) 450 3926", "+16504503926", "16504503926"]
  brazil_nums = ["(48) 84357475"] # this is a valid number, but fails
  weird_ones = ["18008884231", "581752671235", u"\u263A"]
  print standardize_numbers(my_nums)
  print standardize_numbers(brazil_nums)
  print standardize_numbers(weird_ones)
