import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "./input";
import { Check } from "lucide-react";

export default function AutocompleteInput({
  inputValue,
  suggestions,
  setInputValue,
  inputRef,
  selectedSuggestions,
  setSelectedSuggestions,
}: {
  inputValue: string | undefined;
  suggestions: string[] | undefined;
  setInputValue: (value: string | undefined) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  selectedSuggestions: string[];
  setSelectedSuggestions: (value: string[]) => void;
}) {
  const [inputSuggestions, setInputSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);
  const activeItemRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    // Filter suggestions based on input value
    if (!inputValue || inputValue.trim() === "") {
      setInputSuggestions([]);
      setIsOpen(false);
    } else {
      const filtered =
        suggestions?.filter((item) =>
          item.toLowerCase().includes(inputValue.toLowerCase()),
        ) || [];
      setInputSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    }
    setActiveIndex(-1);
  }, [inputValue]);

  // Handle clicks outside the component to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef?.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeItemRef.current && suggestionsRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (selectedSuggestions.includes(suggestion)) {
      setSelectedSuggestions(
        selectedSuggestions.filter((item) => item !== suggestion),
      );
    } else {
      setSelectedSuggestions([...selectedSuggestions, suggestion]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle keyboard navigation
    if (!suggestions) return;
    if ((e.key === "Tab" || e.key === "ArrowDown") && isOpen) {
      e.preventDefault();
      setActiveIndex((prevIndex) =>
        prevIndex < inputSuggestions.length - 1 ? prevIndex + 1 : 0,
      );
    } else if (
      ((e.shiftKey && e.key === "Tab") || e.key === "ArrowUp") &&
      isOpen
    ) {
      e.preventDefault();
      setActiveIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : inputSuggestions.length - 1,
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(
        inputSuggestions ? inputSuggestions[activeIndex] : "",
      );
    } else if (e.key === "Escape") {
      if (isOpen) {
        setIsOpen(false);
      }
      if (!isOpen) {
        inputRef?.current?.blur();
      }
    }
  };

  return (
    <div className="w-full max-w-md relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={() => inputValue && inputSuggestions.length && setIsOpen(true)}
        placeholder="Filter by title and/or tags.."
        className="w-full"
      />

      {isOpen && (
        <ul
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-2 max-h-60 overflow-auto bg-popover border rounded-md shadow-lg shadow-popover"
        >
          <span className="text-xs text-muted-foreground px-4 py-2">Tags</span>
          {inputSuggestions.map((suggestion, index) => (
            <li
              key={index}
              ref={index === activeIndex ? activeItemRef : null}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`text-sm m-1.5 px-4 py-2 rounded-sm flex items-center cursor-pointer hover:bg-accent ${
                index === activeIndex ? "bg-accent" : ""
              }`}
            >
              <span>{suggestion}</span>
              <Check
                className={`ml-auto h-4 w-4 ${
                  selectedSuggestions?.includes(suggestion)
                    ? "text-primary"
                    : "hidden"
                }`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
